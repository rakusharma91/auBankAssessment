import Dashboard from "views/Dashboard.js";

const dashboardRoutes = [
	{
		path: "",
		name: "Sales Overview",
		icon: "nc-icon nc-chart-pie-35",
		component: Dashboard,
		layout: "/admin"
	},
	{
		path: "",
		name: "Stores",
		icon: "nc-icon nc-circle-09",
		component: Dashboard,
		layout: "#"
	},
	{
		path: "",
		name: "Notifications",
		icon: "nc-icon nc-bell-55",
		component: Dashboard,
		layout: "#"
	},
	{
		path: "",
		name: "Settings",
		icon: "nc-icon nc-paper-2",
		component: Dashboard,
		layout: "#"
	},
	{
		path: "",
		name: "Dark Theme",
		icon: "nc-icon nc-atom",
		component: Dashboard,
		layout: "#"
	}
];

export default dashboardRoutes;
