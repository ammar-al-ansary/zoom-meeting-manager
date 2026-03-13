const { Router } = require("express");
const controller = require("../controllers/meetingController");
const validate = require("../middleware/validate");
const { listMeetingsSchema, createMeetingSchema } = require("../validators/meetingValidator");

const router = Router();

router.get("/", validate(listMeetingsSchema, "query"), controller.index);
router.get("/:id", controller.show);
router.post("/", validate(createMeetingSchema), controller.create);
router.delete("/:id", controller.destroy);

module.exports = router;
