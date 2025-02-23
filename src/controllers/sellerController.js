const { User } = require("../models");

// @desc Get all sellers
// @route GET /api/sellers
exports.getSellers = async (req, res) => {
  try {
    const sellers = await User.findAll({ where: { role: "seller" }, attributes: { exclude: ["password"] } });
    res.json(sellers);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// @desc Toggle enable/disable a seller
// @route POST /api/sellers/:id/toggle-status
exports.toggleSellerStatus = async (req, res) => {
  try {
    const seller = await User.findByPk(req.params.id);

    if (!seller || seller.role !== "seller") {
      return res.status(404).json({ message: "Seller not found" });
    }

    // Toggle status
    seller.isDisabled = !seller.isDisabled;
    await seller.save();

    res.json({
      message: `Seller has been ${seller.isDisabled ? "disabled" : "enabled"} successfully.`,
      isDisabled: seller.isDisabled,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

