"use client"

import { useState, useEffect } from "react"
import Navbar from "../../components/Navbar"
import StatCard from "../../components/StatCard"
import axiosInstance from "../../utils/axiosInstance"
import { API_PATHS } from "../../utils/apiPaths"
import { ListTodo, CheckCircle2, Clock, AlertCircle } from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
  AreaChart,
  Area,
} from "recharts"
import { formatDate } from "../../utils/helper"

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.DASHBOARD_DATA)
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

  const { statistics, charts, recentTasks, hierarchyUsers } = dashboardData || {}

  // Prepare data for charts
  const statusData = charts?.taskDistribution
    ? [
        { name: "Pending", value: charts.taskDistribution.Pending },
        { name: "In Progress", value: charts.taskDistribution.InProgress },
        { name: "Completed", value: charts.taskDistribution.Completed },
      ]
    : []

  const priorityData = charts?.taskPriorityLevels
    ? [
        { name: "Low", value: charts.taskPriorityLevels.Low },
        { name: "Medium", value: charts.taskPriorityLevels.Medium },
        { name: "High", value: charts.taskPriorityLevels.High },
      ]
    : []

  const progressBandData = charts?.progressBands || []
  const checklistTotals = charts?.checklistTotals || {}
  const checklistRadialData = [
    {
      name: "Checklist completion",
      value: checklistTotals.checklistCompletionRate || 0,
      fill: "#0f766e",
    },
  ]

  const COLORS = ["#f59e0b", "#3b82f6", "#10b981"]

  return (
    <>
      <Navbar />
      <div className="container">
        <h1 style={{ fontSize: "2rem", fontWeight: "700", marginBottom: "2rem", color: "var(--text)" }}>
          Operations Dashboard
        </h1>

        {/* Statistics Cards */}
        <div className="dashboard-grid">
          <StatCard title="My Rank" value={statistics?.myRank || "-"} icon={ListTodo} color="var(--text)" />
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
          <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "1rem" }}>Team Overview</h2>
          <p style={{ color: "var(--text-light)", marginBottom: "1rem" }}>
            Keep track of teammates in your workspace, their roles, and their current level across the organization.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
            {hierarchyUsers?.length ? (
              hierarchyUsers.map((person) => (
                <div key={person._id} style={{ border: "1px solid var(--border)", borderRadius: "14px", padding: "1rem" }}>
                  <div style={{ fontWeight: "700" }}>{person.name}</div>
                  <div style={{ color: "var(--text-light)", marginTop: "0.25rem" }}>{person.email}</div>
                  <div style={{ marginTop: "0.65rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    <span className="badge badge-progress">Rank {person.rank}</span>
                    <span className="badge badge-completed">{person.role}</span>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ color: "var(--text-light)" }}>No additional teammates are available in this view right now.</p>
            )}
          </div>
        </div>

        {/* Charts */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
            gap: "1.5rem",
            marginBottom: "2rem",
          }}
        >
          {/* Status Distribution */}
          <div className="card">
            <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "1rem" }}>Task Status Distribution</h2>
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

          {/* Priority Distribution */}
          <div className="card">
            <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "1rem" }}>Task Priority Levels</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={priorityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "0.35rem" }}>Checklist Completion</h2>
            <p style={{ color: "var(--text-light)", marginBottom: "1rem" }}>
              Completion is calculated from checklist items across visible tasks.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: "1rem", alignItems: "center" }}>
              <ResponsiveContainer width="100%" height={240}>
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
              <div style={{ display: "grid", gap: "0.9rem" }}>
                <div style={{ padding: "1rem", borderRadius: "16px", background: "rgba(15,118,110,0.08)" }}>
                  <div style={{ color: "var(--text-light)", fontSize: "0.85rem" }}>Completed items</div>
                  <div style={{ fontSize: "1.6rem", fontWeight: 700, marginTop: "0.25rem" }}>{checklistTotals.completedChecklistItems || 0}</div>
                </div>
                <div style={{ padding: "1rem", borderRadius: "16px", background: "rgba(59,130,246,0.08)" }}>
                  <div style={{ color: "var(--text-light)", fontSize: "0.85rem" }}>Remaining items</div>
                  <div style={{ fontSize: "1.6rem", fontWeight: 700, marginTop: "0.25rem" }}>{checklistTotals.remainingChecklistItems || 0}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "1rem" }}>Task Progress Bands</h2>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={progressBandData}>
                <defs>
                  <linearGradient id="progressBandsFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.7} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.08} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Area type="monotone" dataKey="value" stroke="#0284c7" fill="url(#progressBandsFill)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Tasks */}
        <div className="card">
          <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "1rem" }}>Recent Tasks</h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Due Date</th>
                  <th>Progress</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {recentTasks && recentTasks.length > 0 ? (
                  recentTasks.map((task) => (
                    <tr key={task._id}>
                      <td>{task.title}</td>
                      <td>
                        <span className={`badge badge-${task.status.toLowerCase().replace(" ", "-")}`}>
                          {task.status}
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge-${task.priority.toLowerCase()}`}>{task.priority}</span>
                      </td>
                      <td>{formatDate(task.dueDate)}</td>
                      <td>{task.progress || 0}%</td>
                      <td>{formatDate(task.createdAt)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center" }}>
                      No tasks found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}

export default Dashboard
