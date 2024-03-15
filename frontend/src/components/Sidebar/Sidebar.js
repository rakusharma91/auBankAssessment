import React from "react";
import { NavLink, Link } from "react-router-dom";
import { Nav } from "react-bootstrap";

function Sidebar({routes }) {
	return (
		<div className="sidebar" data-color="black">
			<div className="sidebar-wrapper">
				<div className="logo d-flex align-items-center justify-content-start">
					<Link to="/admin/dashboard" className="simple-text logo-mini mx-1" >
						<div className="logo-img">
							<img src={require("assets/img/reactlogo.png")} alt="..." />
						</div>
					</Link>
					<Link className="simple-text" to="/admin/dashboard">
						Sales Dashboard
					</Link>
				</div>
				<Nav>
					{routes.map((prop, key) => {
						if (!prop.redirect)
							return (
								<li className={!key ? "active" :"" } key={key} >
									<NavLink to={prop.layout + prop.path} className="nav-link" activeClassName="active" >
										<i className={prop.icon} />
										<p>{prop.name}</p>
									</NavLink>
								</li>
							);
						return null;
					})}
				</Nav>
			</div>
		</div>
	);
}
export default Sidebar;
