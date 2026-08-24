import Layout from "@/components/layout";
import { InlineWidget } from "react-calendly";

export default function BookPage() {
  return (
    <Layout>
      <div className="h-[calc(100vh-64px)] w-full bg-white">
        <InlineWidget 
          url="https://calendly.com/productdave" 
          styles={{ height: '100%', width: '100%' }}
          pageSettings={{
            backgroundColor: 'ffffff',
            hideEventTypeDetails: false,
            hideLandingPageDetails: false,
            primaryColor: 'F42A72',
            textColor: '1B4E60'
          }}
        />
      </div>
    </Layout>
  );
}
