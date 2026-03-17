import Image from 'next/image';
import Link from 'next/link';

export function Logo() {
  return (
    <Link
      href="https://www.smylsync.com"
      target="_blank"
      rel="noopener noreferrer"
      className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-black transition-opacity hover:opacity-80 md:h-8 md:w-8"
    >
      <Image
        src="/smylsync-logo.svg"
        alt="Logo"
        width={24}
        height={24}
        className="dark:invert"
      />
    </Link>
  );
}
