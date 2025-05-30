import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import MapboxExample from './Map'

function App() {
  return (
    <div className="Map" style={{height: '100vh', width: '100vw'}}>
      <MapboxExample />
    </div>
  )
}

export default App
