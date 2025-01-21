const express = require("express");
const multer = require("multer");
const app = express();
const path = require("path");
const PORT = 3000;


// Middleware
app.use(express.json()); // To parse JSON bodies
app.use(express.urlencoded({ extended: true })); // For form submissions
app.use(express.static("public")); // For serving static files

// Setup Multer for image uploads
const upload = multer({ dest: "uploads/" });

// Mock database for storing email templates
const emailTemplates = [];

// Route 1: Get layout.html file
app.get("/getEmailLayout", (req, res) => {
  const layoutPath = path.join(__dirname, "templates", "layout.html");

  fs.readFile(layoutPath, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading layout file:", err);
      return res.status(500).send("Error reading layout file.");
    }
    res.type("html").send(data);
  });
});

// Route 2: Upload image assets
app.post("/uploadImage", upload.single("image"), (req, res) => {
  const file = req.file;

  if (!file) {
    return res.status(400).send("No file uploaded.");
  }

  // Construct the URL for the uploaded file
  const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${file.filename}`;

  res.status(200).send({
    message: "Image uploaded successfully.",
    fileUrl: fileUrl,
  });
});

// Route 3: Store email template JSON
app.post("/uploadEmailConfig", (req, res) => {
  const emailConfig = req.body;

  if (!emailConfig || typeof emailConfig !== "object") {
    return res.status(400).send("Invalid email template configuration.");
  }

  emailTemplates.push(emailConfig);
  res.status(200).send({ message: "Email template configuration stored successfully." });
});

// Route 4: Render and download email template
app.post("/renderAndDownloadTemplate", (req, res) => {
  const { templateId, values } = req.body;

  if (!templateId || !values) {
    return res.status(400).send("Invalid request. Provide templateId and values.");
  }

  const selectedTemplate = emailTemplates.find((tpl) => tpl.id === templateId);
  if (!selectedTemplate) {
    return res.status(404).send("Template not found.");
  }

  const layoutPath = path.join(__dirname, "templates", "layout.html");
  fs.readFile(layoutPath, "utf8", (err, layoutHtml) => {
    if (err) {
      console.error("Error reading layout file:", err);
      return res.status(500).send("Error reading layout file.");
    }

    let renderedHtml = layoutHtml;
    for (const key in values) {
      const placeholder = `{{${key}}}`;
      renderedHtml = renderedHtml.replace(new RegExp(placeholder, "g"), values[key]);
    }

    const outputFilePath = path.join(__dirname, "downloads", `rendered_${templateId}.html`);
    fs.writeFile(outputFilePath, renderedHtml, (err) => {
      if (err) {
        console.error("Error writing rendered file:", err);
        return res.status(500).send("Error generating HTML file.");
      }

      res.download(outputFilePath, `rendered_${templateId}.html`, () => {
        // Optionally delete the file after download
        fs.unlink(outputFilePath, () => {});
      });
    });
  });
});

// Serve the main webpage
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Download Section Example</title>
    </head>
    <body>
      <div id="content">
        <h1>Welcome to the Download Section Example</h1>
        <p>This content can be downloaded as an HTML file from the server.</p>
      </div>
      <a href="/download-section" download="section.html">Download Section</a>
    </body>
    </html>
  `);
});

// Route to serve the section as a downloadable HTML file
app.get("/download-section", (req, res) => {
  const htmlContent = `
    <div id="content">
      <h1>Welcome to the Download Section Example</h1>
      <p>This content can be downloaded as an HTML file from the server.</p>
    </div>
  `;

  res.setHeader("Content-Disposition", "attachment; filename=section.html");
  res.setHeader("Content-Type", "text/html");
  res.send(htmlContent);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
