import type { Metadata } from "next";
import RolePresetsClient from "./RolePresetsClient";

export const metadata: Metadata = {
  title: "Role-based Presets",
  description:
    "Drop-in menus for QA, PM, Designer, and Developer with coming-soon placeholders.",
};

export default function RolePresetsPage() {
  return <RolePresetsClient />;
}
