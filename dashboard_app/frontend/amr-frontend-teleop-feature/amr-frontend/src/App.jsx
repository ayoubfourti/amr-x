import TeleopPage from './pages/TeleopPage'
import { useRos } from './hooks/useRos'
import { useTeleopControl } from './hooks/useTeleopControl'

function App() {
  const { ros, connected } = useRos('ws://localhost:9090');
  const { sendCommand, emergencyStop } = useTeleopControl(ros);

  return (
    <TeleopPage
      unitOnline={connected}
      onSendCommand={sendCommand}
      onEmergencyStop={emergencyStop}
    />
  ) 
}

export default App