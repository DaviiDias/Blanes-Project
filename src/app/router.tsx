import { Navigate, createBrowserRouter } from "react-router-dom";

import { BoardPage } from "@/modules/boards/pages/BoardPage";
import { BoardsPage } from "@/modules/boards/pages/BoardsPage";

import { AppShell } from "./layout/AppShell";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      {
        index: true,
        element: <BoardsPage />,
      },
      {
        path: "boards/:boardId",
        element: <BoardPage />,
      },
      {
        path: "*",
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);
