import "./App.css";
import { Navbar } from "./components/Layout/Navbar.tsx";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { MvxContextProvider } from "./contexts/ContextProvider.tsx";
import { routes } from "./routes.ts";
import { Home } from "./pages/Home/index.tsx";
import { Footer } from "./components/Layout/Footer.tsx";
import { TooltipProvider } from "./components/ui/tooltip.tsx";

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-background w-[99.3dvw] justify-center">
        <Navbar />
        <MvxContextProvider>
          <TooltipProvider>
            <main className="flex-grow flex w-full justify-center">
              <Routes>
                <Route path="/" element={<Home />} />
                {routes.map((route, index) => (
                  <Route
                    path={route.path}
                    key={index}
                    element={
                      <div className="flex-grow flex items-center justify-center w-full">
                        <route.component />
                      </div>
                    }
                  />
                ))}
              </Routes>
            </main>
          </TooltipProvider>
        </MvxContextProvider>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
