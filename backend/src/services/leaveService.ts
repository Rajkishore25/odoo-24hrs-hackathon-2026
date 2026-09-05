import { TimeOffService } from "./timeOffService.js";

/**
 * LeaveService aligns with the team file structure convention while
 * preserving the underlying leave/time-off business logic.
 */
export class LeaveService extends TimeOffService {}

export { TimeOffService };
export default LeaveService;
