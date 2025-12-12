const MousePointer = ({
  size = 24,
  strokeWidth = 2,
  fill = "none",
  stroke = "currentColor",
}: {
  size: number;
  strokeWidth: number;
  fill: string;
  stroke: string;
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="lucide lucide-mouse-pointer2-icon lucide-mouse-pointer-2"
    >
      <path d="M4.037 4.688a.495.495 0 0 1 .651-.651l16 6.5a.5.5 0 0 1-.063.947l-6.124 1.58a2 2 0 0 0-1.438 1.435l-1.579 6.126a.5.5 0 0 1-.947.063z" />
    </svg>
  );
};

export default MousePointer;
