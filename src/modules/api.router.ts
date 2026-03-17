import { Router } from "express";

import indexRoute from "./index.routes";
import userRoute from "./users/user.routes";
import uploadRoute from "./common/upload.routes";
import vacanciesRoute from "./vacancies/vacancy.routes";
import applicantsRoute from "./applicants/applicant.routes";
import interviewsRoute from "./interviews/interview.routes";

const apiRouter = Router();

apiRouter.use("/", indexRoute);
apiRouter.use("/users", userRoute);
apiRouter.use("/uploads", uploadRoute);
apiRouter.use("/vacancies", vacanciesRoute);
apiRouter.use("/applicants", applicantsRoute);
apiRouter.use("/interviews", interviewsRoute);

export default apiRouter;
