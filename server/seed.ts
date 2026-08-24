import { db } from "./db";
import { users, courses, modules, settings } from "@shared/schema";

async function seed() {
  console.log("Seeding database...");

  // Create admin user
  const adminResult = await db
    .insert(users)
    .values({
      email: "david@davidwang.com.au",
      name: "Product Dave",
      role: "admin",
      avatar: "https://kajabi-storefronts-production.kajabi-cdn.com/kajabi-storefronts-production/file-uploads/themes/2159999900/settings_images/246750-d158-4c37-0c6f-1a11e5262063_IMG_4971.JPG",
    })
    .returning()
    .catch(() => []);

  if (adminResult.length > 0) {
    console.log("✓ Admin user created");
  }

  // Create sample course
  const course1Result = await db
    .insert(courses)
    .values({
      title: "Anyone Can Be a Product Manager (with AI)",
      description: `
        <h3>Learn the Core Skills of a Professional PM in 4 Weeks with AI</h3>
        <p>I will help you find a fulfilling career in Product Management without wasting thousands for certificates that hiring managers ignore.</p>
        <br/>
        <p><strong>This course covers:</strong></p>
        <ul>
          <li>The Product Function and the Role of a Product Manager</li>
          <li>The End-to-End Product Management Process</li>
          <li>How to Manage Product Ideas</li>
          <li>How to Set Up Objectives and Metrics</li>
          <li>Turning Research Insights Into Product Features</li>
        </ul>
      `,
      instructor: "Product Dave",
      thumbnail: "https://kajabi-storefronts-production.kajabi-cdn.com/kajabi-storefronts-production/file-uploads/themes/2159999900/settings_images/e50a15e-0efe-0d2e-4153-0564e10bd56b_vlcsnap-2025-03-16-10h57m38s900.png",
      stage: 1,
      isLocked: false,
    })
    .returning()
    .catch(() => []);

  const course1 = course1Result[0];

  if (course1) {
    console.log("✓ Course 1 created");

    // Create modules for course 1
    await db.insert(modules).values([
      {
        courseId: course1.id,
        title: "Topic #1: The Product Function & Role",
        duration: "10:24",
        videoId: "9xwazD5SyVg",
        order: 1,
      },
      {
        courseId: course1.id,
        title: "Topic #2: The End-to-End PM Process",
        duration: "15:30",
        videoId: "LXb3EKWsInQ",
        order: 2,
      },
      {
        courseId: course1.id,
        title: "Topic #3: Managing Product Ideas",
        duration: "12:45",
        videoId: "ysz5S6PUM-U",
        order: 3,
      },
      {
        courseId: course1.id,
        title: "Topic #4: Objectives & Metrics (OKRs)",
        duration: "20:10",
        videoId: "9xwazD5SyVg",
        order: 4,
      },
      {
        courseId: course1.id,
        title: "Topic #5: Mapping Product Assumptions",
        duration: "14:20",
        videoId: "LXb3EKWsInQ",
        order: 5,
      },
    ]);

    console.log("✓ Modules for course 1 created");
  }

  // Create more sample courses
  const course2Result = await db
    .insert(courses)
    .values({
      title: "Break into PM BlueStrategy",
      description: "Your strategic roadmap to landing that first Product Management role.",
      instructor: "Product Dave",
      thumbnail: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&auto=format&fit=crop&q=60",
      stage: 2,
      isLocked: false,
    })
    .returning()
    .catch(() => []);

  const course2 = course2Result[0];

  if (course2) {
    console.log("✓ Course 2 created");
    
    await db.insert(modules).values([
      {
        courseId: course2.id,
        title: "Finding Your Product Journey",
        duration: "08:15",
        videoId: "ysz5S6PUM-U",
        order: 1,
      },
      {
        courseId: course2.id,
        title: "Resume & Interview Prep",
        duration: "18:20",
        videoId: "LXb3EKWsInQ",
        order: 2,
      },
    ]);

    console.log("✓ Modules for course 2 created");
  }

  // Create locked courses for the roadmap
  await db.insert(courses).values([
    {
      title: "Advanced Product Strategy",
      description: "Master the art of product strategy and vision.",
      instructor: "Product Dave",
      thumbnail: "https://images.unsplash.com/photo-1553877607-422830722365?w=800&auto=format&fit=crop&q=60",
      stage: 3,
      isLocked: true,
    },
    {
      title: "Leadership & Stakeholder Management",
      description: "Learn to influence without authority.",
      instructor: "Product Dave",
      thumbnail: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&auto=format&fit=crop&q=60",
      stage: 4,
      isLocked: true,
    },
    {
      title: "Product Executive Masterclass",
      description: "Scaling product organizations and culture.",
      instructor: "Product Dave",
      thumbnail: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&auto=format&fit=crop&q=60",
      stage: 5,
      isLocked: true,
    },
  ]);

  console.log("✓ Roadmap courses created");

  // Set default settings
  await db
    .insert(settings)
    .values([
      { key: "calendly_url", value: "https://calendly.com/productdave" },
    ])
    .catch(() => null);

  console.log("✓ Settings created");

  console.log("✅ Seeding complete!");
  process.exit(0);
}

seed().catch((error) => {
  console.error("Seeding failed:", error);
  process.exit(1);
});
