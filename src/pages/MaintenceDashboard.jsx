const MaintenceDashboard = () => {
    const [modelAccuracy, setModelAccuracy] = useState("92.5%");
    const [inferenceSpeed, setInferenceSpeed] = useState("50ms");
    const [modelUpdates, setModelUpdates] = useState("Last update: 3 days ago");
  
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <h1 className="text-3xl font-bold text-gray-800">ML Maintenance Dashboard</h1>
        <p className="text-gray-600 mb-6">Monitor ML model performance</p>
        <div className="grid grid-cols-3 gap-6">
          <DashboardCard title="Model Accuracy" value={modelAccuracy} status="Stable" color="purple" />
          <DashboardCard title="Inference Speed" value={inferenceSpeed} status="Optimal" color="blue" />
          <DashboardCard title="Model Updates" value={modelUpdates} status="Up to date" color="yellow" />
        </div>
      </div>
    );
  };
  
  export default  MaintenceDashboard ;
  