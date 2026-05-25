import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/useAuth";
import { normalizeAcademicLevel, toApiAcademicLevel } from "../utils/academicProfile";
import { getApiErrorMessage } from "../utils/auth";
import { getBoardPaperById, listBoardPapers } from "../api/api";
import { Button, Card, EmptyState, ErrorMessage, LoadingSpinner, PageHeader, PaperRenderer, ResponsiveContainer } from "../components/ui";

const FULL_PAPER_VALUE = "FULL";
const PAPER_TYPE_ORDER = ["CQ", "MCQ", "WRITTEN"];
const ACADEMIC_LEVEL_OPTIONS = ["SSC", "HSC"];

function getOptionalText(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
}

function normalizeResponseItems(payload) {
  const items = payload?.papers || payload?.exams || payload?.items || payload?.data || payload || [];
  return Array.isArray(items) ? items : items ? [items] : [];
}

function normalizeBoardPaper(source) {
  const paper = source?.paper || source?.exam || source || {};
  const questions = Array.isArray(source?.questions)
    ? source.questions
    : Array.isArray(paper?.questions)
      ? paper.questions
      : Array.isArray(source?.question_list)
        ? source.question_list
        : Array.isArray(paper?.question_list)
          ? paper.question_list
          : [];

  return {
    exam_id: paper.exam_id ?? source?.exam_id ?? paper.id ?? source?.id ?? paper.paper_id ?? source?.paper_id ?? "",
    exam_name: getOptionalText(paper.exam_name ?? source?.exam_name),
    board_name: getOptionalText(paper.board_name ?? source?.board_name ?? paper.board ?? source?.board),
    exam_year: paper.exam_year ?? source?.exam_year ?? "",
    subject_name: getOptionalText(paper.subject_name ?? source?.subject_name),
    subject_code: getOptionalText(paper.subject_code ?? source?.subject_code),
    academic_level: getOptionalText(paper.academic_level ?? source?.academic_level).toUpperCase(),
    paper_type: getOptionalText(paper.paper_type ?? source?.paper_type).toUpperCase(),
    time: getOptionalText(paper.time ?? source?.time),
    total_marks: paper.total_marks ?? source?.total_marks ?? "",
    group: getOptionalText(paper.group ?? source?.group).toUpperCase(),
    questions,
  };
}

function uniqueValues(items, getValue) {
  const seen = new Set();
  const values = [];

  items.forEach((item) => {
    const value = getValue(item);
    if (!value || seen.has(value)) {
      return;
    }

    seen.add(value);
    values.push(value);
  });

  return values;
}

function sortPaperTypes(types) {
  return [...types].sort((left, right) => {
    const leftIndex = PAPER_TYPE_ORDER.indexOf(left);
    const rightIndex = PAPER_TYPE_ORDER.indexOf(right);

    if (leftIndex === -1 && rightIndex === -1) {
      return left.localeCompare(right);
    }

    if (leftIndex === -1) {
      return 1;
    }

    if (rightIndex === -1) {
      return -1;
    }

    return leftIndex - rightIndex;
  });
}

function groupByPaperType(papers) {
  const groups = new Map();

  papers.forEach((paper) => {
    const paperType = paper.paper_type || "Unknown";
    if (!groups.has(paperType)) {
      groups.set(paperType, []);
    }

    groups.get(paperType).push(paper);
  });

  return sortPaperTypes(Array.from(groups.keys())).map((paperType) => ({ paperType, papers: groups.get(paperType) || [] }));
}

function formatBoardDisplayLabel(boardName) {
  const value = getOptionalText(boardName);
  if (!value) {
    return "";
  }

  return /board$/i.test(value) ? value : `${value} Board`;
}

function BoardPapersPage() {
  const { user, loading: authLoading } = useAuth();
  const [availablePapers, setAvailablePapers] = useState([]);
  const [loadingAvailable, setLoadingAvailable] = useState(true);
  const [loadingPaper, setLoadingPaper] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [selectedAcademicLevel, setSelectedAcademicLevel] = useState("");
  const [selectedSubjectCode, setSelectedSubjectCode] = useState("");
  const [selectedBoardName, setSelectedBoardName] = useState("");
  const [selectedExamYear, setSelectedExamYear] = useState("");
  const [selectedPaperType, setSelectedPaperType] = useState(FULL_PAPER_VALUE);
  const [renderPaperType, setRenderPaperType] = useState(FULL_PAPER_VALUE);
  const [renderedPapers, setRenderedPapers] = useState([]);

  const defaultAcademicLevel = useMemo(() => {
    const source = user?.academic_level ?? user?.academicLevel ?? user?.profile?.academic_level ?? user?.profile?.academicLevel ?? "";
    return toApiAcademicLevel(normalizeAcademicLevel(source)) || "";
  }, [user]);

  const hasAcademicLevel = Boolean(selectedAcademicLevel);
  const missingAcademicProfile = !authLoading && !defaultAcademicLevel && !hasAcademicLevel;

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (defaultAcademicLevel) {
      setSelectedAcademicLevel((current) => current || defaultAcademicLevel);
      setMessage("");
      setError("");
      return;
    }

    setAvailablePapers([]);
    setLoadingAvailable(false);
    setMessage("Please complete your academic profile first.");
  }, [authLoading, defaultAcademicLevel]);

  useEffect(() => {
    if (authLoading || !selectedAcademicLevel) {
      return undefined;
    }

    let isMounted = true;

    async function loadAvailablePapers() {
      setLoadingAvailable(true);
      setError("");
      setMessage("");

      try {
        const response = await listBoardPapers({ academic_level: selectedAcademicLevel });
        const normalized = normalizeResponseItems(response).map(normalizeBoardPaper);
        if (isMounted) {
          setAvailablePapers(normalized);
        }
      } catch (fetchError) {
        if (isMounted) {
          setError(getApiErrorMessage(fetchError, "Failed to load board papers."));
          setAvailablePapers([]);
        }
      } finally {
        if (isMounted) {
          setLoadingAvailable(false);
        }
      }
    }

    loadAvailablePapers();

    return () => {
      isMounted = false;
    };
  }, [authLoading, selectedAcademicLevel]);

  const academicLevelOptions = useMemo(() => ACADEMIC_LEVEL_OPTIONS, []);

  const subjectOptions = useMemo(() => {
    const filtered = availablePapers.filter((paper) => !selectedAcademicLevel || paper.academic_level === selectedAcademicLevel);
    const options = new Map();

    filtered.forEach((paper) => {
      const value = paper.subject_code || paper.subject_name;
      if (!value || options.has(value)) {
        return;
      }

      options.set(value, {
        value,
        label: paper.subject_name && paper.subject_code ? `${paper.subject_name} (${paper.subject_code})` : paper.subject_name || paper.subject_code,
        subject_name: paper.subject_name,
      });
    });

    return Array.from(options.values()).sort((left, right) => left.label.localeCompare(right.label));
  }, [availablePapers, selectedAcademicLevel]);

  const boardOptions = useMemo(() => {
    const filtered = availablePapers.filter(
      (paper) => (!selectedAcademicLevel || paper.academic_level === selectedAcademicLevel) && (!selectedSubjectCode || paper.subject_code === selectedSubjectCode),
    );

    const options = new Map();

    filtered.forEach((paper) => {
      const value = getOptionalText(paper.board_name);
      if (!value || options.has(value)) {
        return;
      }

      options.set(value, {
        value,
        label: formatBoardDisplayLabel(value),
      });
    });

    return Array.from(options.values()).sort((left, right) => left.label.localeCompare(right.label));
  }, [availablePapers, selectedAcademicLevel, selectedSubjectCode]);

  const yearOptions = useMemo(() => {
    const filtered = availablePapers.filter(
      (paper) =>
        (!selectedAcademicLevel || paper.academic_level === selectedAcademicLevel) &&
        (!selectedSubjectCode || paper.subject_code === selectedSubjectCode) &&
        (!selectedBoardName || paper.board_name === selectedBoardName),
    );

    const options = new Map();

    filtered.forEach((paper) => {
      const value = paper.exam_year === null || paper.exam_year === undefined || paper.exam_year === "" ? "" : Number(paper.exam_year);
      if (!value || options.has(String(value))) {
        return;
      }

      options.set(String(value), {
        value,
        label: String(value),
      });
    });

    return Array.from(options.values()).sort((left, right) => Number(right.value) - Number(left.value));
  }, [availablePapers, selectedAcademicLevel, selectedBoardName, selectedSubjectCode]);

  const paperTypeOptions = useMemo(() => {
    const filtered = availablePapers.filter(
      (paper) =>
        (!selectedAcademicLevel || paper.academic_level === selectedAcademicLevel) &&
        (!selectedSubjectCode || paper.subject_code === selectedSubjectCode) &&
        (!selectedBoardName || paper.board_name === selectedBoardName) &&
        (!selectedExamYear || String(paper.exam_year) === String(selectedExamYear)),
    );

    const types = uniqueValues(filtered, (paper) => paper.paper_type).filter(Boolean);
    return [
      { value: FULL_PAPER_VALUE, label: "Full Paper" },
      ...sortPaperTypes(types).map((paperType) => ({ value: paperType, label: paperType })),
    ];
  }, [availablePapers, selectedAcademicLevel, selectedBoardName, selectedExamYear, selectedSubjectCode]);

  const selectedSubject = useMemo(
    () => subjectOptions.find((option) => option.value === selectedSubjectCode) || null,
    [selectedSubjectCode, subjectOptions],
  );

  const selectedGroup = useMemo(() => {
    const matchingPaper = availablePapers.find(
      (paper) =>
        (!selectedAcademicLevel || paper.academic_level === selectedAcademicLevel) &&
        (!selectedSubjectCode || paper.subject_code === selectedSubjectCode) &&
        (!selectedBoardName || paper.board_name === selectedBoardName) &&
        (!selectedExamYear || String(paper.exam_year) === String(selectedExamYear)) &&
        (selectedPaperType === FULL_PAPER_VALUE || !selectedPaperType || paper.paper_type === selectedPaperType),
    );

    return getOptionalText(matchingPaper?.group || availablePapers.find((paper) => paper.group)?.group).toUpperCase() || "COMMON";
  }, [availablePapers, selectedAcademicLevel, selectedBoardName, selectedExamYear, selectedPaperType, selectedSubjectCode]);

  const visiblePapers = useMemo(() => {
    if (renderedPapers.length === 0) {
      return [];
    }

    if (renderPaperType === FULL_PAPER_VALUE) {
      return renderedPapers;
    }

    return renderedPapers.filter((paper) => paper.paper_type === renderPaperType);
  }, [renderPaperType, renderedPapers]);

  const groupedVisiblePapers = useMemo(() => groupByPaperType(visiblePapers), [visiblePapers]);

  async function handleViewPaper() {
    if (!selectedAcademicLevel || !selectedSubjectCode || !selectedBoardName || !selectedExamYear) {
      setMessage("Please select academic level, subject, board, and year before viewing a paper.");
      setRenderedPapers([]);
      setError("");
      return;
    }

    setLoadingPaper(true);
    setError("");
    setMessage("");

    const matchingPapers = availablePapers.filter((paper) => {
      return (
        String(paper.academic_level).toUpperCase() === String(selectedAcademicLevel).toUpperCase() &&
        String(paper.subject_code) === String(selectedSubjectCode) &&
        String(paper.board_name) === String(selectedBoardName) &&
        Number(paper.exam_year) === Number(selectedExamYear)
      );
    });

    let targetPapers = matchingPapers;

    if (selectedPaperType && selectedPaperType !== "FULL" && selectedPaperType !== "Full Paper") {
      targetPapers = matchingPapers.filter(
        (paper) => String(paper.paper_type).toUpperCase() === String(selectedPaperType).toUpperCase(),
      );
    }

    console.log("Board paper load params", {
      academic_level: selectedAcademicLevel,
      subject_code: selectedSubjectCode,
      board_name: selectedBoardName,
      exam_year: selectedExamYear,
      paper_type: selectedPaperType,
      group: selectedGroup,
    });
    console.log("AVAILABLE_PAPERS", availablePapers);
    console.log("SELECTED_FILTERS", {
      selectedAcademicLevel,
      selectedSubjectCode,
      selectedBoardName,
      selectedYear: selectedExamYear,
      selectedPaperType,
    });
    console.log("MATCHING_PAPERS", matchingPapers);
    console.log("TARGET_PAPERS", targetPapers);
    console.log("LOADING_EXAM_IDS", targetPapers.map((paper) => paper.exam_id));

    if (!targetPapers.length) {
      setLoadingPaper(false);
      setError("No paper found for this board, year, and subject.");
      return;
    }

    try {
      const results = await Promise.all(targetPapers.map((paper) => getBoardPaperById(paper.exam_id)));
      const normalized = results.map(normalizeBoardPaper);
      const hasAnyPaper = normalized.some((paper) => paper.exam_id || paper.questions.length > 0 || paper.paper_type);

      if (!hasAnyPaper) {
        setRenderedPapers([]);
        setError("No paper found for this board, year, and subject.");
        return;
      }

      setRenderedPapers(normalized);
      setRenderPaperType(normalized.length === 1 ? normalized[0].paper_type || FULL_PAPER_VALUE : FULL_PAPER_VALUE);
      setError("");
    } catch (fetchError) {
      setRenderedPapers([]);
      setError(getApiErrorMessage(fetchError, "Failed to load the requested board paper."));
    } finally {
      setLoadingPaper(false);
    }
  }

  const hasRenderedPapers = renderedPapers.length > 0;
  const renderTypeOptions = useMemo(() => {
    if (!hasRenderedPapers) {
      return [];
    }

    const types = uniqueValues(renderedPapers, (paper) => paper.paper_type).filter(Boolean);
    if (renderedPapers.length === 1) {
      return types.length > 0
        ? types.map((type) => ({ value: type, label: type }))
        : [{ value: renderedPapers[0].paper_type || FULL_PAPER_VALUE, label: renderedPapers[0].paper_type || "Full Paper" }];
    }

    return [
      { value: FULL_PAPER_VALUE, label: "Full Paper" },
      ...sortPaperTypes(types).map((type) => ({ value: type, label: type })),
    ];
  }, [hasRenderedPapers, renderedPapers]);

  useEffect(() => {
    if (renderTypeOptions.length === 0) {
      return;
    }

    if (!renderTypeOptions.some((option) => option.value === renderPaperType)) {
      setRenderPaperType(renderTypeOptions[0].value);
    }
  }, [renderPaperType, renderTypeOptions]);

  if (loadingAvailable && availablePapers.length === 0) {
    return (
      <ResponsiveContainer>
        <PageHeader
          eyebrow="BOARD PAPERS"
          title="Board Paper Viewer"
          description="Select an academic level, subject, board, year, and paper type to load a unique board paper."
        />
        <div className="flex justify-center rounded-2xl border border-slate-200 bg-white py-12">
          <LoadingSpinner label="Loading board papers..." />
        </div>
      </ResponsiveContainer>
    );
  }
  return (
    <ResponsiveContainer>
      <PageHeader
        eyebrow="BOARD PAPERS"
        title="Board Paper Viewer"
        description="Load a unique board paper by academic level, subject, board, year, and paper type."
        stats={[
          <div key="available" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Available Papers</p>
            <p className="mt-1 text-lg font-semibold text-slate-950">{availablePapers.length}</p>
          </div>,
          <div key="loaded" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Loaded Result</p>
            <p className="mt-1 text-lg font-semibold text-slate-950">{renderedPapers.length || 0}</p>
          </div>,
        ]}
      />

      {error && <ErrorMessage>{error}</ErrorMessage>}
      {missingAcademicProfile && <ErrorMessage tone="warning">Please complete your academic profile first.</ErrorMessage>}
      {message && !error && !missingAcademicProfile && <ErrorMessage tone="info">{message}</ErrorMessage>}

      <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <Card className="space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Filters</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">Pick the exact board paper you want to view.</p>
          </div>

          <div className="space-y-4">
            <label className="block space-y-2 text-sm font-medium text-slate-700">
              Academic Level
              <select
                value={selectedAcademicLevel}
                onChange={(event) => {
                  setSelectedAcademicLevel(event.target.value);
                  setSelectedSubjectCode("");
                  setSelectedBoardName("");
                  setSelectedExamYear("");
                  setSelectedPaperType(FULL_PAPER_VALUE);
                  setRenderedPapers([]);
                  setRenderPaperType(FULL_PAPER_VALUE);
                  setMessage("");
                }}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-cyan-400 focus:bg-white"
              >
                <option value="">{authLoading ? "Loading academic level..." : "Select academic level"}</option>
                {academicLevelOptions.map((level) => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </label>

            <label className="block space-y-2 text-sm font-medium text-slate-700">
              Subject
              <select
                value={selectedSubjectCode}
                onChange={(event) => {
                  setSelectedSubjectCode(event.target.value);
                  setSelectedBoardName("");
                  setSelectedExamYear("");
                  setSelectedPaperType(FULL_PAPER_VALUE);
                }}
                disabled={!selectedAcademicLevel || subjectOptions.length === 0}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-cyan-400 focus:bg-white disabled:cursor-not-allowed disabled:bg-slate-100"
              >
                <option value="">{!selectedAcademicLevel ? "Select academic level first" : "Select subject"}</option>
                {subjectOptions.map((subject) => (
                  <option key={subject.value} value={subject.value}>{subject.label}</option>
                ))}
              </select>
            </label>

            <label className="block space-y-2 text-sm font-medium text-slate-700">
              Board
              <select
                value={selectedBoardName}
                onChange={(event) => {
                  setSelectedBoardName(event.target.value);
                  setSelectedExamYear("");
                  setSelectedPaperType(FULL_PAPER_VALUE);
                }}
                disabled={!selectedSubjectCode || boardOptions.length === 0}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-cyan-400 focus:bg-white disabled:cursor-not-allowed disabled:bg-slate-100"
              >
                <option value="">{!selectedSubjectCode ? "Select subject first" : "Select board"}</option>
                {boardOptions.map((board) => (
                  <option key={board.value} value={board.value}>{board.label}</option>
                ))}
              </select>
            </label>

            <label className="block space-y-2 text-sm font-medium text-slate-700">
              Year
              <select
                value={selectedExamYear}
                onChange={(event) => {
                  setSelectedExamYear(event.target.value);
                  setSelectedPaperType(FULL_PAPER_VALUE);
                }}
                disabled={!selectedBoardName || yearOptions.length === 0}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-cyan-400 focus:bg-white disabled:cursor-not-allowed disabled:bg-slate-100"
              >
                <option value="">{!selectedBoardName ? "Select board first" : "Select year"}</option>
                {yearOptions.map((year) => (
                  <option key={year.value} value={year.value}>{year.label}</option>
                ))}
              </select>
            </label>

            <label className="block space-y-2 text-sm font-medium text-slate-700">
              Paper Type
              <select
                value={selectedPaperType}
                onChange={(event) => setSelectedPaperType(event.target.value)}
                disabled={!selectedExamYear || paperTypeOptions.length === 0}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-cyan-400 focus:bg-white disabled:cursor-not-allowed disabled:bg-slate-100"
              >
                {paperTypeOptions.map((paperType) => (
                  <option key={paperType.value} value={paperType.value}>{paperType.label}</option>
                ))}
              </select>
            </label>
          </div>

          <Button type="button" onClick={handleViewPaper} disabled={loadingPaper} className="w-full">
            {loadingPaper ? "Loading Paper..." : "View Paper"}
          </Button>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
            <p className="font-semibold text-slate-950">Selected</p>
            <p className="mt-2 break-words">{selectedAcademicLevel || "Academic level not selected"}</p>
            <p className="mt-1 break-words">{selectedSubject?.label || "Subject not selected"}</p>
            <p className="mt-1 break-words">{selectedBoardName || "Board not selected"}</p>
            <p className="mt-1 break-words">{selectedExamYear || "Year not selected"}</p>
            <p className="mt-1 break-words">{selectedPaperType === FULL_PAPER_VALUE ? "Full Paper" : selectedPaperType || "Paper type not selected"}</p>
          </div>
        </Card>

        <div className="space-y-6">
          {hasRenderedPapers && renderTypeOptions.length > 1 && (
            <Card className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Paper Type</h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">Switch between individual sections or the full grouped paper.</p>
              </div>

              <div className="flex flex-wrap gap-2">
                {renderTypeOptions.map((paperType) => (
                  <button
                    key={paperType.value}
                    type="button"
                    onClick={() => setRenderPaperType(paperType.value)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      renderPaperType === paperType.value
                        ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/20"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-950"
                    }`}
                  >
                    {paperType.label}
                  </button>
                ))}
              </div>
            </Card>
          )}

          {!loadingPaper && !hasRenderedPapers && !message && !error && (
            <EmptyState
              title="No paper loaded yet"
              description="Choose the filters on the left, then click View Paper to fetch the matching board paper."
            />
          )}

          {hasRenderedPapers && renderPaperType === FULL_PAPER_VALUE ? (
            <div className="space-y-6">
              {groupedVisiblePapers.map((group) => (
                <div key={group.paperType} className="space-y-3">
                  {groupedVisiblePapers.length > 1 && (
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-xl font-semibold text-slate-950">{group.paperType}</h3>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">{group.papers.length} paper{group.papers.length === 1 ? "" : "s"}</span>
                    </div>
                  )}
                  <div className="space-y-4">
                    {group.papers.map((paper, index) => (
                      <PaperRenderer key={paper.exam_id || `${group.paperType}-${index}`} paper={paper} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : hasRenderedPapers && groupedVisiblePapers.length > 0 ? (
            <div className="space-y-6">
              {groupedVisiblePapers.map((group) => (
                <div key={group.paperType} className="space-y-3">
                  {groupedVisiblePapers.length > 1 && (
                    <h3 className="text-xl font-semibold text-slate-950">{group.paperType}</h3>
                  )}
                  <div className="space-y-4">
                    {group.papers.map((paper, index) => (
                      <PaperRenderer key={paper.exam_id || `${group.paperType}-${index}`} paper={paper} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {loadingPaper && (
        <div className="flex justify-center rounded-2xl border border-slate-200 bg-white py-10">
          <LoadingSpinner label="Loading paper..." />
        </div>
      )}
    </ResponsiveContainer>
  );
}

export default BoardPapersPage;