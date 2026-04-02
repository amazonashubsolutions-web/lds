import PrimaryHeader from "../components/layout/PrimaryHeader";
import DashboardActivityFeed from "../components/panel-control/DashboardActivityFeed";
import DashboardNotifications from "../components/panel-control/DashboardNotifications";
import DashboardPastBookings from "../components/panel-control/DashboardPastBookings";
import DashboardSidebar from "../components/panel-control/DashboardSidebar";
import DashboardStatusCard from "../components/panel-control/DashboardStatusCard";
import DashboardUpcomingTripCard from "../components/panel-control/DashboardUpcomingTripCard";
import DashboardWelcome from "../components/panel-control/DashboardWelcome";
import Footer from "../components/resultados/Footer";
import {
  footerData,
  panelControlActivity,
  panelControlMenu,
  panelControlPastBookings,
  panelControlProfile,
  panelControlStatus,
  panelControlUpcomingTrip,
  panelControlWelcome,
} from "../data/panelControlData";

export default function PanelControlPage() {
  return (
    <div className="panel-control-page">
      <PrimaryHeader />

      <main className="panel-control-main">
        <div className="panel-control-layout">
          <DashboardSidebar menu={panelControlMenu} profile={panelControlProfile} />

          <section className="panel-control-content">
            <DashboardWelcome data={panelControlWelcome} />

            <div className="panel-control-highlight-grid">
              <div className="panel-control-highlight-main">
                <DashboardUpcomingTripCard trip={panelControlUpcomingTrip} />
              </div>
              <div className="panel-control-highlight-side">
                <DashboardStatusCard status={panelControlStatus} />
              </div>
            </div>

            <div className="panel-control-bottom-grid">
              <DashboardPastBookings items={panelControlPastBookings} />
              <DashboardActivityFeed items={panelControlActivity} />
            </div>

            <DashboardNotifications />
          </section>
        </div>
      </main>

      <Footer data={footerData} />
    </div>
  );
}
