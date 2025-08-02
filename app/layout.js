import './../styles/globals.css'; // Import global CSS styles


export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Grade Prediction Calculator</title>
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}