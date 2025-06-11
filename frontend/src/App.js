import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Login from './components/Login';
import './App.css';

function App() {
  const [input, setInput] = useState('');
  const [tasks, setTasks] = useState([]);
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
      fetchTasks();
    }
  }, []);

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/tasks', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasks(res.data);
    } catch (error) {
      setError('Failed to fetch tasks');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/tasks', 
        { input },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setInput('');
      fetchTasks();
    } catch (error) {
      debugger;
      setError(error.response?.data.error || error.response?.data);
    }
  };

  const handleLogin = (userData) => {
    setUser(userData);
    fetchTasks();
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setTasks([]);
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="app-container">
      <div className="app-content">
        <div className="header">
          <h1>Natural Language Task Manager</h1>
          <div className="user-info">
            <span>Welcome, {user.name}</span>
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit} className="task-form">
          <div className="input-group">
            <input
              className="task-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder='e.g. Finish landing page Aman by 11pm 20th June P1'
              required
            />
            <button type="submit" className="submit-button">Add Task</button>
          </div>
        </form>

        <div className="table-container">
          <table className="tasks-table">
            <thead>
              <tr>
                <th>Task</th>
                <th>Assigned To</th>
                <th>Due Date</th>
                <th>Priority</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(task => (
                <tr key={task._id}>
                  <td>{task.name}</td>
                  <td>{task.assignee}</td>
                  <td>{new Date(task.dueDate).toLocaleString()}</td>
                  <td>
                    <span className={`priority-badge priority-${task.priority.toLowerCase()}`}>
                      {task.priority}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default App;
