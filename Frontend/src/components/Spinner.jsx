const sizeClassMap = {
  sm: 'h-6 w-6 border-2',
  md: 'h-10 w-10 border-4',
  lg: 'h-14 w-14 border-4',
};

const Spinner = ({
  label = 'Loading...',
  size = 'md',
  fullScreen = true,
  className = '',
}) => {
  const spinnerSize = sizeClassMap[size] || sizeClassMap.md;

  const content = (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`} role="status" aria-live="polite">
      <div
        className={`${spinnerSize} animate-spin rounded-full border-slate-300 border-t-slate-700`}
        aria-hidden="true"
      />
      {label ? <p className="text-sm font-medium text-slate-600">{label}</p> : null}
      <span className="sr-only">Loading</span>
    </div>
  );

  if (fullScreen) {
    return <div className="flex min-h-[40vh] items-center justify-center">{content}</div>;
  }

  return content;
};

export default Spinner;
