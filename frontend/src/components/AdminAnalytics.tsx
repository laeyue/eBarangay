import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface AnalyticsProps {
  incidents: any[];
  documents: any[];
  polls: any[];
  stats?: any;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 border border-gray-300 rounded shadow">
        <p className="font-semibold text-sm">
          {payload[0].payload.name || payload[0].payload.date}
        </p>
        <p className="text-sm text-gray-700">
          {payload[0].name}:{" "}
          <span className="font-bold">{payload[0].value}</span>
        </p>
      </div>
    );
  }
  return null;
};

export const AdminAnalytics = ({
  incidents,
  documents,
  polls,
  stats,
}: AnalyticsProps) => {
  // Incidents by type
  const incidentsByType = incidents.reduce((acc: any, incident) => {
    const type = incident.type || "other";
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  const incidentTypeData = Object.entries(incidentsByType).map(
    ([name, value]) => {
      // Format compound words like "public-safety" to "Public Safety"
      const formatted = name
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
      return {
        name: formatted,
        value,
      };
    }
  );

  // Incidents by priority
  const incidentsByPriority = incidents.reduce((acc: any, incident) => {
    const priority = incident.priority || "medium";
    acc[priority] = (acc[priority] || 0) + 1;
    return acc;
  }, {});

  const incidentPriorityData = Object.entries(incidentsByPriority).map(
    ([name, value]) => {
      // Properly capitalize priority levels
      const priorityMap: { [key: string]: string } = {
        low: "Low",
        medium: "Medium",
        high: "High",
        critical: "Critical",
      };
      return {
        name: priorityMap[name] || name.charAt(0).toUpperCase() + name.slice(1),
        value,
      };
    }
  );

  // Incidents by status
  const incidentsByStatus = incidents.reduce((acc: any, incident) => {
    const status = incident.status || "pending";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const incidentStatusData = Object.entries(incidentsByStatus).map(
    ([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.replace("_", " ").slice(1),
      value,
    })
  );

  // Documents by status
  const documentsByStatus = documents.reduce((acc: any, doc) => {
    const status = doc.status || "pending";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const documentStatusData = Object.entries(documentsByStatus).map(
    ([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    })
  );

  // Documents by type
  const documentsByType = documents.reduce((acc: any, doc) => {
    const type = doc.documentType || "other";
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  const documentTypeData = Object.entries(documentsByType).map(
    ([name, value]) => ({
      name,
      value,
    })
  );

  // Poll participation
  const pollData = polls.map((poll) => ({
    name:
      poll.title.length > 20 ? poll.title.substring(0, 20) + "..." : poll.title,
    responses: poll.responses?.length || 0,
    questions: poll.questions?.length || 0,
  }));

  // Trend data (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date.toISOString().split("T")[0];
  });

  const trendData = last7Days.map((date) => {
    const dayIncidents = incidents.filter(
      (inc) => inc.createdAt && inc.createdAt.split("T")[0] === date
    ).length;
    const dayDocuments = documents.filter(
      (doc) => doc.createdAt && doc.createdAt.split("T")[0] === date
    ).length;

    return {
      date: new Date(date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      incidents: dayIncidents,
      documents: dayDocuments,
    };
  });

  // Priority vs Status scatter plot data
  const priorityMap = { low: 1, medium: 2, high: 3, critical: 4 };
  const statusMap = { pending: 1, in_progress: 2, resolved: 3 };

  const scatterData = incidents.map((incident, idx) => ({
    x: priorityMap[incident.priority as keyof typeof priorityMap] || 2,
    y: statusMap[incident.status as keyof typeof statusMap] || 1,
    name: incident.type || "incident",
  }));

  return (
    <div className="space-y-6">
      {/* Verified Users Overview */}
      <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
        <CardHeader>
          <CardTitle className="text-purple-900">
            User Verification Status
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            Overview of user verification across the platform
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {stats ? (
              <>
                <div className="grid grid-cols-3 gap-4">
                  {/* Total Users */}
                  <div className="bg-white p-4 rounded-lg border border-purple-100">
                    <p className="text-sm text-gray-600 font-medium">
                      Total Users
                    </p>
                    <p className="text-3xl font-bold text-purple-600 mt-2">
                      {stats.totalUsers || 0}
                    </p>
                  </div>

                  {/* Verified Users */}
                  <div className="bg-white p-4 rounded-lg border border-green-100">
                    <p className="text-sm text-gray-600 font-medium">
                      Verified Users
                    </p>
                    <p className="text-3xl font-bold text-green-600 mt-2">
                      {stats.verifiedUsers || 0}
                    </p>
                  </div>

                  {/* Verification Rate */}
                  <div className="bg-white p-4 rounded-lg border border-blue-100">
                    <p className="text-sm text-gray-600 font-medium">
                      Verification Rate
                    </p>
                    <p className="text-3xl font-bold text-blue-600 mt-2">
                      {stats.totalUsers
                        ? Math.round(
                            ((stats.verifiedUsers || 0) / stats.totalUsers) *
                              100
                          )
                        : 0}
                      %
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="bg-white p-4 rounded-lg border border-purple-100">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-700">
                      Verification Progress
                    </p>
                    <p className="text-xs font-semibold text-purple-600">
                      {stats.verifiedUsers || 0} of {stats.totalUsers || 0}
                    </p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-purple-600 to-pink-600 h-full transition-all duration-500 rounded-full"
                      style={{
                        width: stats.totalUsers
                          ? `${
                              ((stats.verifiedUsers || 0) / stats.totalUsers) *
                              100
                            }%`
                          : "0%",
                      }}
                    />
                  </div>
                </div>

                {/* Statistics Summary */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <p className="text-sm text-green-700 font-medium">
                      Unverified Users
                    </p>
                    <p className="text-2xl font-bold text-green-600 mt-1">
                      {(stats.totalUsers || 0) - (stats.verifiedUsers || 0)}
                    </p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-700 font-medium">
                      Active Users
                    </p>
                    <p className="text-2xl font-bold text-blue-600 mt-1">
                      {stats.activeUsers || 0}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Loading verification data...
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Incidents by Type */}
        <Card className="flex flex-col min-h-[550px]">
          <CardHeader>
            <CardTitle>Incidents by Type</CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Distribution of reported incidents across different categories
            </p>
          </CardHeader>
          <CardContent className="flex flex-col flex-1 justify-between">
            {incidentTypeData.length > 0 ? (
              <>
                <div className="flex-1 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={380}>
                    <BarChart data={incidentTypeData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="name"
                        angle={-45}
                        textAnchor="end"
                        height={100}
                      />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar
                        dataKey="value"
                        fill="#3b82f6"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <figcaption className="text-xs text-gray-500 text-center mt-4">
                  Figure: Distribution of incident types
                </figcaption>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No data to display
              </div>
            )}
          </CardContent>
        </Card>

        {/* Incidents by Priority */}
        <Card className="flex flex-col min-h-[550px]">
          <CardHeader>
            <CardTitle>Incidents by Priority Level</CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Count of incidents grouped by priority classification
            </p>
          </CardHeader>
          <CardContent className="flex flex-col flex-1 justify-between">
            {incidentPriorityData.length > 0 ? (
              <>
                <div className="flex-1 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart
                      data={incidentPriorityData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis
                        label={{
                          value: "Count",
                          angle: -90,
                          position: "insideLeft",
                          offset: 10,
                        }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" fill="#8884d8" name="Incidents" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <figcaption className="text-xs text-gray-500 text-center mt-4">
                  Figure: Bar chart showing incident count for each priority
                  level
                </figcaption>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No data to display
              </div>
            )}
          </CardContent>
        </Card>

        {/* Priority vs Status Scatter Plot */}
        <Card className="flex flex-col md:col-span-2 min-h-[550px]">
          <CardHeader>
            <CardTitle>Incident Priority vs Status Analysis</CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Scatter plot showing relationship between incident priority levels
              and their resolution status
            </p>
          </CardHeader>
          <CardContent className="flex flex-col flex-1 justify-between">
            {scatterData.length > 0 ? (
              <>
                <div className="flex-1 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={400}>
                    <ScatterChart
                      margin={{ top: 20, right: 30, left: 30, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        type="number"
                        dataKey="x"
                        name="Priority"
                        label={{
                          value: "Priority (Low→High)",
                          position: "insideBottom",
                          offset: -10,
                        }}
                      />
                      <YAxis
                        type="number"
                        dataKey="y"
                        name="Status"
                        label={{
                          value: "Status (Pending→Resolved)",
                          angle: -90,
                          position: "insideLeft",
                        }}
                      />
                      <Tooltip
                        cursor={{ strokeDasharray: "3 3" }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const priorityLabels = [
                              "",
                              "Low",
                              "Medium",
                              "High",
                              "Critical",
                            ];
                            const statusLabels = [
                              "",
                              "Pending",
                              "In Progress",
                              "Resolved",
                            ];
                            const p = payload[0].payload;
                            return (
                              <div className="bg-white p-2 border border-gray-300 rounded shadow">
                                <p className="font-semibold text-sm">
                                  Incident: {p.name}
                                </p>
                                <p className="text-sm text-gray-700">
                                  Priority: {priorityLabels[p.x] || "Unknown"}
                                </p>
                                <p className="text-sm text-gray-700">
                                  Status: {statusLabels[p.y] || "Unknown"}
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Scatter
                        name="Incidents"
                        data={scatterData}
                        fill="#8b5cf6"
                      />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
                <figcaption className="text-xs text-gray-500 text-center mt-4">
                  Figure: Scatter plot showing distribution of incidents by
                  priority level and resolution status
                </figcaption>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No data to display
              </div>
            )}
          </CardContent>
        </Card>

        {/* Incident Status */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Incident Status Distribution</CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Percentage of incidents in each status (pending, in-progress,
              resolved)
            </p>
          </CardHeader>
          <CardContent className="flex flex-col flex-1 justify-between">
            {incidentStatusData.length > 0 ? (
              <>
                <div className="flex-1 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={incidentStatusData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="name"
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar
                        dataKey="value"
                        fill="#10b981"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <figcaption className="text-xs text-gray-500 text-center mt-4">
                  Figure: Distribution of incidents by status (pending,
                  in-progress, resolved)
                </figcaption>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No data to display
              </div>
            )}
          </CardContent>
        </Card>

        {/* Document Status */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Document Requests by Status</CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Number of document requests in each processing stage
            </p>
          </CardHeader>
          <CardContent className="flex flex-col flex-1 justify-between">
            {documentStatusData.length > 0 ? (
              <>
                <div className="flex-1 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart
                      data={documentStatusData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis
                        label={{
                          value: "Count",
                          angle: -90,
                          position: "insideLeft",
                          offset: 10,
                        }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" fill="#00C49F" name="Requests" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <figcaption className="text-xs text-gray-500 text-center mt-4">
                  Figure: Bar chart showing document request count by processing
                  status
                </figcaption>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No data to display
              </div>
            )}
          </CardContent>
        </Card>

        {/* Documents by Type */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Documents by Type</CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Request volume for different document categories
            </p>
          </CardHeader>
          <CardContent className="flex flex-col flex-1 justify-between">
            {documentTypeData.length > 0 ? (
              <>
                <div className="flex-1 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart
                      data={documentTypeData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="name"
                        angle={-45}
                        textAnchor="end"
                        height={100}
                      />
                      <YAxis
                        label={{
                          value: "Count",
                          angle: -90,
                          position: "insideLeft",
                          offset: 10,
                        }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" fill="#FFBB28" name="Requests" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <figcaption className="text-xs text-gray-500 text-center mt-4">
                  Figure: Bar chart showing request frequency by document type
                </figcaption>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No data to display
              </div>
            )}
          </CardContent>
        </Card>

        {/* Poll Participation */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Poll Participation Overview</CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Response and question counts for active polls
            </p>
          </CardHeader>
          <CardContent className="flex flex-col flex-1 justify-between">
            {pollData.length > 0 ? (
              <>
                <div className="flex-1 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart
                      data={pollData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="name"
                        angle={-45}
                        textAnchor="end"
                        height={120}
                      />
                      <YAxis
                        label={{
                          value: "Count",
                          angle: -90,
                          position: "insideLeft",
                          offset: 10,
                        }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ paddingTop: "20px" }} />
                      <Bar
                        dataKey="responses"
                        fill="#8884d8"
                        name="Responses"
                      />
                      <Bar
                        dataKey="questions"
                        fill="#82ca9d"
                        name="Questions"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <figcaption className="text-xs text-gray-500 text-center mt-4">
                  Figure: Grouped bar chart comparing question count vs.
                  response count per poll
                </figcaption>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No data to display
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Trend Analysis */}
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle>Activity Trend (Last 7 Days)</CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            Daily incident reports and document requests over the past week
          </p>
        </CardHeader>
        <CardContent className="flex flex-col flex-1 justify-between">
          {trendData.length > 0 ? (
            <>
              <div className="flex-1 flex items-center justify-center">
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart
                    data={trendData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis
                      label={{
                        value: "Count",
                        angle: -90,
                        position: "insideLeft",
                        offset: 10,
                      }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ paddingTop: "20px" }} />
                    <Line
                      type="monotone"
                      dataKey="incidents"
                      stroke="#8884d8"
                      name="Incidents"
                      strokeWidth={2}
                      dot={{ fill: "#8884d8", r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="documents"
                      stroke="#82ca9d"
                      name="Documents"
                      strokeWidth={2}
                      dot={{ fill: "#82ca9d", r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <figcaption className="text-xs text-gray-500 text-center mt-4">
                Figure: Line chart tracking daily activity with separate traces
                for incidents and document requests
              </figcaption>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No data to display
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
