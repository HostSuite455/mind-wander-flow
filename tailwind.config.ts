import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Travel theme colors
        ocean: {
          DEFAULT: "hsl(var(--ocean))",
          dark: "hsl(var(--ocean-dark))",
        },
        coral: {
          DEFAULT: "hsl(var(--coral))",
          dark: "hsl(var(--coral-dark))",
        },
        sand: "hsl(var(--sand))",
        seafoam: {
          DEFAULT: "hsl(var(--seafoam))",
          light: "hsl(var(--seafoam-light))",
        },
        // HostSuite theme colors
        'hostsuite-primary': 'hsl(var(--hostsuite-primary))',
        'hostsuite-secondary': 'hsl(var(--hostsuite-secondary))',
        'hostsuite-accent': 'hsl(var(--hostsuite-accent))',
        'hostsuite-text': 'hsl(var(--hostsuite-text))',
        'hostsuite-light': 'hsl(var(--hostsuite-light))',
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      backgroundImage: {
        'gradient-ocean': 'var(--gradient-ocean)',
        'gradient-sunset': 'var(--gradient-sunset)',
        'gradient-hero': 'var(--gradient-hero)',
        'gradient-hostsuite': 'var(--gradient-hostsuite)',
        'gradient-hostsuite-sunset': 'var(--gradient-hostsuite-sunset)',
        'gradient-hostsuite-hero': 'var(--gradient-hostsuite-hero)',
      },
      boxShadow: {
        'soft': 'var(--shadow-soft)',
        'glow': 'var(--shadow-glow)',
      },
      transitionTimingFunction: {
        'smooth': 'var(--transition-smooth)',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  safelist: [
    // Most used button and badge classes
    'bg-hostsuite-primary','text-hostsuite-primary','border-hostsuite-primary',
    'bg-hostsuite-secondary','text-hostsuite-secondary',
    'bg-hostsuite-accent','text-hostsuite-accent',
    'text-hostsuite-text','bg-hostsuite-light',
    'hover:bg-hostsuite-primary','hover:text-hostsuite-primary'
  ],
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
