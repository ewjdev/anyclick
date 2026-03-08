import type { InputHTMLAttributes } from "react";
import { forwardRef } from "react";
import { AnyclickInput } from "../styling";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>((props, ref) => {
  return <AnyclickInput ref={ref} slotName="shared.input" {...props} />;
});

Input.displayName = "Input";
