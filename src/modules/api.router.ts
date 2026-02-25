import { Router } from "express";

import indexRoute from "./index.routes";
import userRoute from "./users/user.routes";
import locationsRoute from "./locations/locations.routes";
import uploadRoute from "./common/upload.routes";
import kardexRoute from "./kardex/kardex.routes";
import assignmentsRoute from "./assignments/assignment.routes";
import recurringRoute from "./recurring/recurring.routes";
import incidentRoute from "./incidents/incident.routes";
import roundRoute from "./rounds/round.routes";
import scheduleRoute from "./schedules/schedule.routes";
import maintenanceRoute from "./maintenance/maintenance.routes";


const apiRouter = Router();

apiRouter.use("/", indexRoute);
apiRouter.use("/users", userRoute);
apiRouter.use("/locations", locationsRoute);
apiRouter.use("/uploads", uploadRoute);
apiRouter.use("/kardex", kardexRoute);
apiRouter.use("/assignments", assignmentsRoute);
apiRouter.use("/recurring", recurringRoute);
apiRouter.use("/incidents", incidentRoute);
apiRouter.use("/rounds", roundRoute);
apiRouter.use("/schedules", scheduleRoute);
apiRouter.use("/maintenance", maintenanceRoute);


export default apiRouter;
