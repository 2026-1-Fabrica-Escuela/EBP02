import { RouterProvider } from "react-router";
import { Toaster } from "sonner";
import { router } from "./routes";
import { AppProvider } from "./context/AppContext";

export default function App() {
  return (
    <AppProvider>
      <Toaster position="top-right" richColors closeButton />
      <RouterProvider router={router} />
    </AppProvider>
  );
}
