import Card from "@/custom-components/Card";
import { useSelector } from "react-redux";

const FeaturedAuctions = () => {
  const { allAuctions, loading } = useSelector((state) => state.auction);
  return (
    <>
      <section className="my-8">
        <h3 className="text-[#111] text-3xl font-bold mb-8 text-left">
          Featured Auctions
        </h3>
        <div className="flex flex-wrap gap-6">
          {allAuctions.slice(0, 8).map((element) => {
            return (
              <Card
                title={element.title}
                imgSrc={element.image?.url}
                startTime={element.startTime}
                endTime={element.endTime}
                startingBid={element.startingBid}
                id={element._id}
                bids={element.bids}
                key={element._id}
              />
            );
          })}
        </div>
      </section>
    </>
  );
};

export default FeaturedAuctions;
