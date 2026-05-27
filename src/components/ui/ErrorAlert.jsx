import ErrorMessage from "./ErrorMessage";

function ErrorAlert({ title, children, tone = "error" }) {
  if (!children) {
    return null;
  }

  return (
    <ErrorMessage tone={tone}>
      {title ? <strong className="block text-sm font-semibold">{title}</strong> : null}
      {title ? <span className="mt-1 block">{children}</span> : children}
    </ErrorMessage>
  );
}

export default ErrorAlert;