"use client";

import { useCallback, useMemo, useState } from "react";
import type { ContextMenuItem } from "@ewjdev/anyclick-react";
import {
  getWorkflowActionById,
  getWorkflowActionsForWorkstream,
} from "./registry";
import type {
  WorkflowActionDefinition,
  WorkflowActionId,
  WorkflowLaunchState,
  WorkflowWorkstreamId,
} from "./types";

interface WorkflowLauncherResult {
  activeWorkflow: WorkflowLaunchState | null;
  closeWorkflow: () => void;
  getMenuItemsForActionIds: (actionIds: WorkflowActionId[]) => ContextMenuItem[];
  menuItems: ContextMenuItem[];
}

export function useWorkflowLauncher(
  workstream: WorkflowWorkstreamId,
): WorkflowLauncherResult {
  const [activeWorkflow, setActiveWorkflow] = useState<WorkflowLaunchState | null>(
    null,
  );

  const openWorkflow = useCallback(
    (nextState: Omit<WorkflowLaunchState, "openedAt">) => {
      setActiveWorkflow({
        ...nextState,
        openedAt: new Date().toISOString(),
      });
    },
    [],
  );

  const closeWorkflow = useCallback(() => {
    setActiveWorkflow(null);
  }, []);

  const buildMenuItems = useCallback(
    (actions: WorkflowActionDefinition[]): ContextMenuItem[] => {
      return actions.map((action) => ({
        label: action.menuLabel,
        showComment: false,
        type: action.menuType,
        onClick: ({ closeMenu, containerElement, targetElement }) => {
          openWorkflow({
            action,
            containerElement,
            targetElement,
          });

          closeMenu();
          return false;
        },
      }));
    },
    [openWorkflow],
  );

  const menuItems = useMemo<ContextMenuItem[]>(() => {
    const actions = getWorkflowActionsForWorkstream(workstream);
    return buildMenuItems(actions);
  }, [buildMenuItems, workstream]);

  const getMenuItemsForActionIds = useCallback(
    (actionIds: WorkflowActionId[]): ContextMenuItem[] => {
      const actions = actionIds.map((actionId) => getWorkflowActionById(actionId));
      return buildMenuItems(actions);
    },
    [buildMenuItems],
  );

  return {
    activeWorkflow,
    closeWorkflow,
    getMenuItemsForActionIds,
    menuItems,
  };
}
