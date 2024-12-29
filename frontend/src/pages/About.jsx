import React from "react";

const About = () => {
  const values = [
    {
      id: 1,
      title: "Integrity",
      description:
        "We prioritize honesty and transparency in all our dealings, ensuring a fair and ethical auction experience for everyone.",
    },
    {
      id: 2,
      title: "Innovation",
      description:
        "We continually enhance our platform with cutting-edge technology and features to provide users with a seamless and efficient auction process.",
    },
    {
      id: 3,
      title: "Community",
      description:
        "We foster a vibrant community of buyers and sellers who share a passion for finding and offering exceptional items.",
    },
    {
      id: 4,
      title: "Customer Focus",
      description:
        "We are committed to providing exceptional customer support and resources to help users navigate the auction process with ease.",
    },
  ];

  return (
    <section className="w-full px-5 pt-[150px] lg:px-[30px] flex flex-col min-h-screen py-8">
      <div className="bg-white mx-auto w-full max-w-4xl h-auto px-8 py-10 flex flex-col gap-6 items-center justify-center rounded-lg shadow-lg">
        <h1 className="text-[#d6482b] text-4xl font-bold mb-8 text-center">About Us</h1>
        <p className="text-lg text-stone-600 mb-8 text-center">
          Welcome to Nelami-Ghar, the ultimate destination for online auctions and bidding excitement. Founded in 2024, we are dedicated to providing a dynamic and user-friendly platform for buyers and sellers to connect, explore, and transact in a secure and seamless environment.
        </p>
        <div className="w-full">
          <h3 className="text-[#111] text-2xl font-semibold mb-4">Our Mission</h3>
          <p className="text-lg text-stone-600 mb-8">
            At Nelami-Ghar, our mission is to revolutionize the way people buy and sell items online. We strive to create an engaging and trustworthy marketplace that empowers individuals and businesses to discover unique products, make informed decisions, and enjoy the thrill of competitive bidding.
          </p>
          <h3 className="text-[#111] text-2xl font-semibold mb-4">Our Values</h3>
          <ul className="list-inside mb-8">
            {values.map((element) => (
              <li className="text-lg text-stone-600 mb-4" key={element.id}>
                <span className="text-black font-bold">{element.title}</span>: {element.description}
              </li>
            ))}
          </ul>
          <h3 className="text-[#111] text-2xl font-semibold mb-4">Our Story</h3>
          <p className="text-lg text-stone-600 mb-8">
            NelamiGhar was born out of a passion for connecting people with unique and valuable items. With years of experience in the auction industry, our team is committed to creating a platform that offers an unparalleled auction experience for users worldwide.
          </p>
          <h3 className="text-[#111] text-2xl font-semibold mb-4">Join Us</h3>
          <p className="text-lg text-stone-600 mb-8">
            Whether you're looking to buy, sell, or simply explore, NelamiGhar invites you to join our growing community of auction enthusiasts. Discover new opportunities, uncover hidden gems, and experience the thrill of winning your next great find.
          </p>
          <p className="text-[#d6482b] text-xl font-bold mb-3 text-center">
            Thank you for choosing NelamiGhar. We look forward to being a part of your auction journey!
          </p>
        </div>
      </div>
    </section>
  );
};

export default About;
