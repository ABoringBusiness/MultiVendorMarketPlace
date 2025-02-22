
import {
  FaUser,
  FaGavel,
  FaEnvelope,
  FaDollarSign,
  FaFileInvoice,
  FaRedo,
} from "react-icons/fa";

const HowItWorks = () => {
  const steps = [
    {
      icon: <FaUser />, 
      title: "User Registration", 
      description: "Users must register or log in to perform operations such as posting auctions, bidding on items, accessing the dashboard, and sending payment proof."
    },
    {
      icon: <FaGavel />, 
      title: "Role Selection", 
      description: 'Users can register as either a "Bidder" or "Auctioneer." Bidders can bid on items, while Auctioneers can post items.'
    },
    {
      icon: <FaEnvelope />, 
      title: "Winning Bid Notification", 
      description: "After winning an item, the highest bidder will receive an email with the Auctioneer's payment method information, including bank transfer, Easypaisa, and PayPal."
    },
    {
      icon: <FaDollarSign />, 
      title: "Commission Payment", 
      description: "If the Bidder pays, the Auctioneer must pay 1% of that payment to the platform. Failure to pay results in being unable to post new items, and a legal notice will be sent."
    },
    {
      icon: <FaFileInvoice />, 
      title: "Proof of Payment", 
      description: "The platform receives payment proof as a screenshot and the total amount sent. Once approved by the Administrator, the unpaid commission of the Auctioneer will be adjusted accordingly."
    },
    {
      icon: <FaRedo />, 
      title: "Reposting Items", 
      description: "If the Bidder does not pay, the Auctioneer can republish the item without any additional cost."
    }
  ];

  return (
    <section className="w-full px-5 pt-[150px] lg:px-[30px] flex flex-col min-h-screen py-8">
      <div className="bg-white mx-auto w-full max-w-4xl h-auto px-8 py-10 flex flex-col gap-6 items-center justify-center rounded-lg shadow-lg">
        <h1 className="text-[#d6482b] text-4xl font-bold mb-10">Discover How NelamiGhar Operates</h1>
        <div className="flex flex-col gap-8 w-full">
          {steps.map((element, index) => (
            <div key={index} className="bg-white rounded-md p-5 flex flex-col gap-4 group hover:bg-black transition-all duration-300">
              <div className="bg-black text-white p-4 text-2xl rounded-full w-fit group-hover:bg-[#d6482b] transition-all duration-300">
                {element.icon}
              </div>
              <h3 className="text-[#D6482B] text-2xl font-semibold mb-2 group-hover:text-white transition-all duration-300">{element.title}</h3>
              <p className="text-lg text-stone-700 group-hover:text-white transition-all duration-300">{element.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
