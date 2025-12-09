import React from "react";
import { Alert, Button } from "./ui";

interface StatusBannerProps {
  message: string;
  onRefresh: () => void;
}

export function StatusBanner({ message, onRefresh }: StatusBannerProps) {
  return (
    <Alert variant="warning" className="ac:mx-0 ac:mt-0 ac:rounded-none">
      <div className="ac:flex ac:flex-col ac:gap-2">
        <p className="ac:text-xs ac:text-yellow-200">{message}</p>
        <Button size="sm" variant="outline" onClick={onRefresh}>
          Refresh page
        </Button>
      </div>
    </Alert>
  );
}
