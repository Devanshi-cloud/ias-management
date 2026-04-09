"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import Navbar from "../../components/Navbar"
import StatCard from "../../components/StatCard"
import TaskCard from "../../components/TaskCard"
import axiosInstance from "../../utils/axiosInstance"
import { API_PATHS } from "../../utils/apiPaths"
import { ListTodo, CheckCircle2, Clock, AlertCircle } from "lucide-react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, RadialBarChart, RadialBar, AreaChart, Area, CartesianGrid, XAxis, YAxis } from "recharts"

const UserDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedPersonId, setSelectedPersonId] = useState("all")

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.USER_DASHBOARD_DATA)
      setDashboardData(response.data)
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container">
          <p>Loading dashboard...</p>
        </div>
      </>
    )
  }

  const { statistics, charts, recentTasks, hierarchyUsers, teamProgress } = dashboardData || {}

  const statusData = charts?.taskDistribution
    ? [
        { name: "Pending", value: charts.taskDistribution.Pending },
        { name: "In Progress", value: charts.taskDistribution.InProgress },
        { name: "Completed", value: charts.taskDistribution.Completed },
      ]
    : []
  const progressBandData = charts?.progressBands || []
  const checklistTotals = charts?.checklistTotals || {}
  const checklistRadialData = [
    {
      name: "Checklist completion",
      value: checklistTotals.checklistCompletionRate || 0,
      fill: "#16a34a",
    },
  ]

  const COLORS = ["#f59e0b", "#3b82f6", "#10b981"]
  const displayedTasks =
    selectedPersonId === "all"
      ? recentTasks || []
      : (recentTasks || []).filter((task) =>
          (task.assignedTo || []).some((person) => person._id === selectedPersonId),
        )

  return (
    <>
      <Navbar />
      <div className="container">
        <h1 style={{ fontSize: "2rem", fontWeight: "700", marginBottom: "2rem", color: "var(--text)" }}>
          My Dashboard
        </h1>

        {/* Statistics Cards */}
        <div className="dashboard-grid">
          <StatCard title="Total Tasks" value={statistics?.totalTasks || 0} icon={ListTodo} color="var(--primary)" />
          <StatCard title="Pending Tasks" value={statistics?.pendingTasks || 0} icon={Clock} color="var(--warning)" />
          <StatCard
            title="Completed Tasks"
            value={statistics?.completedTasks || 0}
            icon={CheckCircle2}
            color="var(--success)"
          />
          <StatCard
            title="Overdue Tasks"
            value={statistics?.overdueTasks || 0}
            icon={AlertCircle}
            color="var(--danger)"
          />
          <StatCard
            title="Checklist Done"
            value={`${checklistTotals.checklistCompletionRate || 0}%`}
            icon={CheckCircle2}
            color="var(--success)"
          />
          <StatCard
            title="Checklist Items"
            value={`${checklistTotals.completedChecklistItems || 0}/${checklistTotals.totalChecklistItems || 0}`}
            icon={ListTodo}
            color="var(--secondary)"
          />
        </div>

        <div className="card" style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
            <div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: "600" }}>Team Visibility</h2>
              <p style={{ color: "var(--text-light)", marginTop: "0.4rem" }}>
                See the teammates available in your workspace and create work from the task center whenever needed.
              </p>
            </div>
            <Link to="/tasks/create" className="btn btn-primary">
              Add Task
            </Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginTop: "1rem" }}>
            {hierarchyUsers?.length ? (
              hierarchyUsers.map((person) => (
                <div key={person._id} style={{ border: "1px solid var(--border)", borderRadius: "14px", padding: "1rem" }}>
                  <div style={{ fontWeight: "700" }}>{person.name}</div>
                  <div style={{ color: "var(--text-light)", marginTop: "0.25rem" }}>{person.email}</div>
                  <div style={{ marginTop: "0.6rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    <span className="badge badge-completed">{person.role}</span>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ color: "var(--text-light)" }}>No additional teammates are available in your current workspace view.</p>
            )}
          </div>
        </div>

        {statistics?.leaderView && (
          <div className="card" style={{ marginBottom: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "center", flexWrap: "wrap", marginBottom: "1rem" }}>
              <div>
                <h2 style={{ fontSize: "1.25rem", fontWeight: "600" }}>Team Progress</h2>
                <p style={{ color: "var(--text-light)", marginTop: "0.35rem" }}>
                  Review work by teammate and switch the task feed to focus on one person at a time.
                </p>
              </div>
              <select className="input" value={selectedPersonId} onChange={(e) => setSelectedPersonId(e.target.value)} style={{ maxWidth: "260px" }}>
                <option value="all">All visible teammates</option>
                {(teamProgress || []).map((person) => (
                  <option key={person._id} value={person._id}>
                    {person.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
              {(teamProgress || []).map((person) => (
                <button
                  key={person._id}
                  type="button"
                  onClick={() => setSelectedPersonId(person._id)}
                  style={{
                    textAlign: "left",
                    border: selectedPersonId === person._id ? "1px solid rgba(59,130,246,0.5)" : "1px solid var(--border)",
                    background: selectedPersonId === person._id ? "rgba(59,130,246,0.06)" : "white",
                    borderRadius: "16px",
                    padding: "1rem",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ fontWeight: "700" }}>{person.name}</div>
                  <div style={{ color: "var(--text-light)", fontSize: "0.9rem", marginTop: "0.25rem" }}>{person.email}</div>
                  <div style={{ marginTop: "0.9rem", display: "grid", gap: "0.35rem", fontSize: "0.9rem" }}>
                    <div><strong>Total:</strong> {person.totalTasks}</div>
                    <div><strong>Completed:</strong> {person.completedTasks}</div>
                    <div><strong>In Progress:</strong> {person.inProgressTasks}</div>
                    <div><strong>Progress:</strong> {person.averageProgress}%</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Task Distribution Chart */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
          <div className="card">
            <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "1rem" }}>Task Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "0.35rem" }}>Checklist Completion</h2>
            <p style={{ color: "var(--text-light)", marginBottom: "1rem" }}>
              Completion is calculated directly from checked checklist items.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: "1rem", alignItems: "center" }}>
              <ResponsiveContainer width="100%" height={220}>
                <RadialBarChart
                  innerRadius="70%"
                  outerRadius="100%"
                  data={checklistRadialData}
                  startAngle={90}
                  endAngle={-270}
                  barSize={18}
                >
                  <RadialBar background clockWise dataKey="value" cornerRadius={9999} />
                  <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" style={{ fill: "#0f172a", fontSize: "1.6rem", fontWeight: 700 }}>
                    {`${checklistTotals.checklistCompletionRate || 0}%`}
                  </text>
                </RadialBarChart>
              </ResponsiveContainer>
              <div style={{ display: "grid", gap: "0.85rem" }}>
                <div style={{ padding: "1rem", borderRadius: "16px", background: "rgba(22,163,74,0.08)" }}>
                  <div style={{ color: "var(--text-light)", fontSize: "0.85rem" }}>Completed items</div>
                  <div style={{ fontSize: "1.5rem", fontWeight: 700, marginTop: "0.25rem" }}>{checklistTotals.completedChecklistItems || 0}</div>
                </div>
                <div style={{ padding: "1rem", borderRadius: "16px", background: "rgba(59,130,246,0.08)" }}>
                  <div style={{ color: "var(--text-light)", fontSize: "0.85rem" }}>Remaining items</div>
                  <div style={{ fontSize: "1.5rem", fontWeight: 700, marginTop: "0.25rem" }}>{checklistTotals.remainingChecklistItems || 0}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="card" style={{ gridColumn: "1 / -1" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "1rem" }}>Progress Landscape</h2>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={progressBandData}>
                <defs>
                  <linearGradient id="memberProgressFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.08} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Area type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={3} fill="url(#memberProgressFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Tasks */}
        <div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: "600", marginBottom: "1rem" }}>Recent Tasks</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.5rem" }}>
            {displayedTasks && displayedTasks.length > 0 ? (
              displayedTasks.slice(0, 8).map((task) => <TaskCard key={task._id} task={task} />)
            ) : (
              <p style={{ color: "var(--text-light)" }}>No tasks available for this selection.</p>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default UserDashboard
