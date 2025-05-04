import { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import DataTable from '@/components/DataTable';
import { generateFixedIncomeData } from '@/utils/generateFixedIncomeData';

function App() {
  const { theme, setTheme } = useTheme();
  const [rowData, setRowData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [rowCount, setRowCount] = useState(10000);

  // Generate data on component mount
  useEffect(() => {
    generateData(rowCount);
  }, []);

  // Function to generate data
  const generateData = async (count: number) => {
    setLoading(true);
    // Use setTimeout to allow UI to update before computation starts
    setTimeout(() => {
      try {
        const generatedData = generateFixedIncomeData(count);
        setRowData(generatedData);
      } catch (error) {
        console.error("Error generating data:", error);
      } finally {
        setLoading(false);
      }
    }, 50);
  };

  // Handle generating new data
  const handleGenerateData = () => {
    generateData(rowCount);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-background border-b z-50">
        <div className="container h-full mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-2xl font-bold">Fixed Income Positions</h2>
            <div className="text-sm text-muted-foreground">
              {rowData.length > 0 ? `${rowData.length.toLocaleString()} rows` : "No data"}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2">
              <span>Rows:</span>
              <select 
                value={rowCount}
                onChange={(e) => setRowCount(Number(e.target.value))}
                className="p-2 border rounded text-sm"
              >
                <option value={100}>100</option>
                <option value={1000}>1,000</option>
                <option value={5000}>5,000</option>
                <option value={10000}>10,000</option>
              </select>
            </div>
            <Button 
              onClick={handleGenerateData}
              disabled={loading}
              variant="outline"
            >
              {loading ? "Generating..." : "Generate Data"}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="relative"
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 pt-20 pb-4">
        <div className="w-full h-[calc(100vh-6rem)] block relative">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="mt-4 text-sm text-muted-foreground">Generating {rowCount.toLocaleString()} rows of data...</p>
              </div>
            </div>
          ) : (
            <DataTable rowData={rowData} />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;