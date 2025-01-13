const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
    if (req.method === "POST") {
        const { priceId } = req.body;

        try {
            const session = await stripe.checkout.sessions.create({
                payment_method_types: ["card"],
                line_items: [
                    {
                        price: priceId,
                        quantity: 1,
                    },
                ],
                mode: "payment",
                success_url: "https://example.com/success", // Cambia esto a tu dominio
                cancel_url: "https://example.com/cancel",  // Cambia esto a tu dominio
            });

            return res.status(200).json({ url: session.url });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
};
