import type { SVGProps } from "react";

export function PostgreSqlIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 13V21" />
      <path d="M12 7.5V2" />
      <path d="M18.5 16.5C18.5 16.5 18 18 15 18C12 18 12 16 12 14C12 12 12 10 15 10C18 10 19 11.5 19 11.5" />
      <path d="M5.5 16.5C5.5 16.5 6 18 9 18C12 18 12 16 12 14" />
      <path d="M12 13H8" />
    </svg>
  );
}

export function MongoDbIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c2.76 0 5.26-1.12 7.07-2.93C15.42 22.88 8 16.5 8 12c0-4.5 7.42-10.88 11.07-7.07C17.26 3.12 14.76 2 12 2z" />
    </svg>
  );
}

export function MariaDbIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 12c-3 0-5.5 2.5-5.5 5.5S9 23 12 23s5.5-2.5 5.5-5.5" />
      <path d="M12 2a4 4 0 0 0-4 4c0 3 4 9 4 9s4-6 4-9a4 4 0 0 0-4-4z" />
      <path d-path="M12 12c-3 0-5.5 2.5-5.5 5.5S9 23 12 23s5.5-2.5 5.5-5.5" d="M9.5 18.5c.5-1 1.5-1.5 2.5-1.5s2 .5 2.5 1.5" />
    </svg>
  );
}

export function OracleIcon(props: SVGProps<SVGSVGElement>) {
    return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8.58 15.43c2.36-2.36 5.48-2.36 7.84 0" />
        <path d="M8.58 8.58c2.36 2.36 5.48 2.36 7.84 0" />
        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
    </svg>
    );
}

export function MySqlIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 12c-3.333-1-5-3-5-5a5 5 0 1 1 10 0c0 2-1.667 4-5 5"/>
      <path d="M12 12v4c0 2.21-2.24 4-5 4s-5-1.79-5-4"/>
      <path d="M12 12v4c0 2.21 2.24 4 5 4s5-1.79 5-4"/>
      <ellipse cx="12" cy="5" rx="5" ry="2"/>
    </svg>
  );
}
