import './../styles/globals.css';

export const metadata = {
  title: 'GradeTrack | Academic Grade Calculator & Target Planner',
  description: 'Full-stack academic performance calculator and 10.0 CGPA tracking platform. Model course syllabi and solve final exam target scores.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}