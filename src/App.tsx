import './App.css'

function App() {
  return (
    <div className="bg-gray-800 text-white min-h-screen flex flex-col items-center justify-center p-4">
      <div className="grid grid-cols-4 gap-4 bg-gray-700 p-4 rounded-lg">
        {Array.from({ length: 16 }).map((_, i) => (
          <div key={i} className="w-16 h-16 md:w-24 md:h-24 bg-gray-600 rounded-lg flex items-center justify-center text-2xl font-bold">
            {/* Tile value will go here */}
          </div>
        ))}
      </div>
    </div>
  )
}

export default App
