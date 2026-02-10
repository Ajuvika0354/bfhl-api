import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const EMAIL = process.env.OFFICIAL_EMAIL;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/* ---------- Utility Functions ---------- */
const isPrime = (n) => {
  if (n < 2) return false;
  for (let i = 2; i <= Math.sqrt(n); i++) {
    if (n % i === 0) return false;
  }
  return true;
};

const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));
const lcm = (a, b) => (a * b) / gcd(a, b);



/* ---------- Health API ---------- */
app.get("/health", (req, res) => {
  res.status(200).json({
    is_success: true,
    official_email: EMAIL
  });
});



/* ---------- BFHL API ---------- */
app.post("/bfhl", async (req, res) => {
  try {
    const body = req.body;
    const keys = Object.keys(body);

    if (keys.length !== 1) {
      return res.status(400).json({
        is_success: false,
        official_email: EMAIL,
        error: "Exactly one input key is required"
      });
    }

    const key = keys[0];
    const value = body[key];
    let data;

    switch (key) {

    // fibonacci
      case "fibonacci":
        if (!Number.isInteger(value) || value < 0) {
          return res.status(400).json({
            is_success: false,
            official_email: EMAIL,
            error: "Invalid fibonacci input"
          });
        }

        let fib = [];
        let a = 0, b = 1;
        for (let i = 0; i < value; i++) {
          fib.push(a);
          [a, b] = [b, a + b];
        }
        data = fib;
        break;

// prime
      case "prime":
        if (!Array.isArray(value)) {
          return res.status(400).json({
            is_success: false,
            official_email: EMAIL,
            error: "Prime input must be an array"
          });
        }
        data = value.filter(n => Number.isInteger(n) && isPrime(n));
        break;

        // lcm
      case "lcm":
        if (!Array.isArray(value) || value.length === 0) {
          return res.status(400).json({
            is_success: false,
            official_email: EMAIL,
            error: "LCM input must be a non-empty array"
          });
        }
        data = value.reduce((acc, n) => lcm(acc, n));
        break;



//    hcf
      case "hcf":
        if (!Array.isArray(value) || value.length === 0) {
          return res.status(400).json({
            is_success: false,
            official_email: EMAIL,
            error: "HCF input must be a non-empty array"
          });
        }
        data = value.reduce((acc, n) => gcd(acc, n));
        break;


        
      /* ---------- AI (OpenAI) ---------- */
      case "AI":
        if (typeof value !== "string" || value.trim() === "") {
          return res.status(400).json({
            is_success: false,
            official_email: EMAIL,
            error: "AI input must be a string"
          });
        }

        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "Answer with ONLY ONE WORD. No explanation."
            },
            {
              role: "user",
              content: value
            }
          ],
          max_tokens: 10
        });

        data = completion.choices[0].message.content
          .trim()
          .split(/\s+/)[0]
          .replace(/[^\w]/g, "");

        break;

      default:
        return res.status(400).json({
          is_success: false,
          official_email: EMAIL,
          error: "Invalid input key"
        });
    }

    res.status(200).json({
      is_success: true,
      official_email: EMAIL,
      data
    });

  } catch (err) {
    res.status(500).json({
      is_success: false,
      official_email: EMAIL,
      error: "Internal Server Error"
    });
  }
});

/* ---------- Server ---------- */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
