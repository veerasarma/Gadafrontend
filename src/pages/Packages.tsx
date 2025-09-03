import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthHeader } from "@/hooks/useAuthHeader";
import { fetchPackages, buyPackage } from "@/services/packageService";
import { Navbar } from "@/components/layout/Navbar";
import Sidebar from "@/components/ui/Sidebar1";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

export default function Packages() {
  const { accessToken } = useAuth();
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [buyingId, setBuyingId] = useState<number | null>(null);
    const [walletBalance, setWalletBalance] = useState<number>(0);
  const [activePlan, setActivePlan] = useState<any | null>(null);
   const navigate = useNavigate();
  
    useEffect(() => {
      getPackages();
    }, [accessToken]);

  const getPackages = async () => {
    if (!accessToken) return; // Wait until token is available
    setLoading(true); // start loading before request
    fetchPackages({ Authorization: `Bearer ${accessToken}` })
      .then((res) => {
        console.log("Packages API response:", res);
        setPackages(res?.data || []); // ensures it's an array
        setWalletBalance(res?.walletBalance || 0);
        setActivePlan(res?.activePlan || null);
      })
      .catch((err) => {
        console.error("Error fetching packages:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleBuy = async (pkg: any) => {
    if (buyingId) return; // prevent spamming
    setBuyingId(pkg.package_id);
    try {
      const data = await buyPackage(
        accessToken!,
        pkg.package_id,
        pkg.name,
        pkg.price
      );
      if (data.status) {
        console.log(data.message);
        toast.success("Purchase successfull!");
        getPackages();
      } else {
        toast.error(data.message);
        navigate("/wallet");
        console.log(data.message || "Purchase failed");
      }
    } catch (err) {
      toast.error("Something went wrong while purchasing.");
      // console.error(err);
      console.log("Something went wrong while purchasing.");
    } finally {
      setBuyingId(null); // reset loader
    }
  };

  // useEffect(() => {
  //   fetchPackages()
  //     .then((res) => {
  //       if (res.status) {
  //         console.log("packages res.data", res.data);
  //         setPackages(res.data);
  //       }
  //     })
  //     .catch(console.error)
  //     .finally(() => setLoading(false));
  // }, []);

  return (
    <div className="flex flex-col min-h-screen bg-cus">
      <Navbar />
      <div className="flex flex-1 overflow-hidden px-4 lg:px-8 py-6">
        <div className="flex flex-1 max-w-[1600px] w-full mx-auto gap-6">
          {/* LEFT SIDEBAR */}
          <aside className="hidden lg:block lg:w-1/5">
            <div className="sticky top-16">
              <Sidebar />
            </div>
          </aside>
          {/* MAIN */}
          <main className="flex-1 flex flex-col overflow-y-auto space-y-6">
            {/* Heading */}
            <div className="text-center">
              <h1 className="text-3xl font-bold text-white mb-2">
                Pro Packages
              </h1>
              <p className="text-lg text-white/80">
                Choose the Plan That's Right for You{" "}
                <strong>( Available Balance : {walletBalance} )</strong>
              </p>
            </div>
            {/* Cards Container */}
            {loading ? (
              <p className="text-white text-center">Loading...</p>
            ) : (
              <div className="flex flex-col md:flex-row gap-6 justify-center">
                {packages.map((pkg) => (
                  <div
                    key={pkg.package_id}
                    className="bg-white rounded-2xl shadow-lg p-6 w-full md:w-1/2 border"
                  >
                    <h2
                      className="text-xl font-bold mb-2"
                      style={{ color: pkg.color || "#000" }}
                    >
                      {pkg.name}
                    </h2>
                    <p className="text-3xl font-bold">N{pkg.price}</p>
                    <p className="text-gray-500 mb-4">
                      for {pkg.period_num} {pkg.period}
                      {pkg.period_num > 1 ? "s" : ""}
                    </p>

                    <ul className="space-y-2 mb-4">
                      {pkg.verification_badge_enabled === "1" && (
                        <li>✅ Verified badge</li>
                      )}
                      {pkg.boost_posts > 0 && (
                        <li>✅ Boost up to {pkg.boost_posts} Posts</li>
                      )}
                      {pkg.boost_pages > 0 && (
                        <li>✅ Boost up to {pkg.boost_pages} Pages</li>
                      )}
                      <li className="font-semibold">🛡 All Permissions</li>
                    </ul>

                    <p
                      className="text-sm text-gray-600 mb-4"
                      dangerouslySetInnerHTML={{
                        __html: pkg.custom_description,
                      }}
                    />

                    <button
                      // onClick={async () => {
                      //   try {
                      //     const data = await buyPackage(
                      //       pkg.package_id,
                      //       pkg.name,
                      //       pkg.price
                      //     );
                      //     if (data.status) {
                      //       alert("Purchase successful!");
                      //     } else {
                      //       alert(data.message || "Purchase failed");
                      //     }
                      //   } catch (err: any) {
                      //     alert(err.message || "Something went wrong");
                      //     console.error(err);
                      //   }
                      // }}
                      onClick={() => handleBuy(pkg)}
                      // disabled={buyingId === pkg.package_id}
                      disabled={
                        buyingId === pkg.package_id ||
                        activePlan?.package_name === "GADA VVIP" || // If user has VVIP → disable all
                        (activePlan?.package_name === "GADA VIP" &&
                          pkg.name === "GADA VIP") // If user has VIP → disable only VIP
                      }
                      className={`w-full rounded-full px-6 py-2 transition
    ${
      buyingId === pkg.package_id ||
      activePlan?.package_name === "GADA VVIP" ||
      (activePlan?.package_name === "GADA VIP" && pkg.name === "GADA VIP")
        ? "bg-gray-400 cursor-not-allowed"
        : "bg-red-500 text-white hover:bg-red-600"
    }`}
                      // className="bg-red-500 w-full text-white rounded-full px-6 py-2 hover:bg-red-600 transition"
                    >
                      {buyingId === pkg.package_id
                        ? "Processing..."
                        : activePlan?.package_name === pkg.name
                        ? "Purchased"
                        : activePlan?.package_name === "GADA VVIP" &&
                          pkg.name === "GADA VIP"
                        ? "Unavailable"
                        : "Buy Now"}
                    </button>
                  </div>
                ))}
              </div>
            )}
            {/* {loading ? (
              <p className="text-white text-center">Loading...</p>
            ) : (
              <div className="flex flex-col md:flex-row gap-6 justify-center">

                <div className="bg-white rounded-2xl shadow-lg p-6 w-full md:w-1/2 border">
                  <h2 className="text-xl font-bold text-red-600 mb-2">
                    GADA VIP
                  </h2>
                  <p className="text-3xl font-bold">N6050</p>
                  <p className="text-gray-500 mb-4">for 30 Day</p>
                  <ul className="space-y-2 mb-4">
                    <li className="flex items-center gap-2">
                      ✅ Featured member
                    </li>
                    <li className="flex items-center gap-2">✅ Verified badge</li>
                    <li className="flex items-center gap-2">
                      ✅ Boost up to 30 Posts
                    </li>
                    <li className="flex items-center gap-2">
                      ✅ Boost up to 20 Pages
                    </li>
                    <li className="flex items-center gap-2 font-semibold">
                      🛡 All Permissions
                    </li>
                  </ul>
                  <p className="text-sm text-gray-600 mb-4">
                    Access to company's hall of fame quarterly discussion.
                  </p>
                  <button className="bg-red-500 w-full text-white rounded-full px-6 py-2 hover:bg-red-600 transition">
                    Buy Now
                  </button>
                </div>


                <div className="bg-white rounded-2xl shadow-lg p-6 w-full md:w-1/2 border">
                  <h2 className="text-xl font-bold text-red-600 mb-2">
                    GADA VVIP
                  </h2>
                  <p className="text-3xl font-bold">N65000</p>
                  <p className="text-gray-500 mb-4">for 365 Day</p>
                  <ul className="space-y-2 mb-4">
                    <li className="flex items-center gap-2">
                      ✅ Featured member
                    </li>
                    <li className="flex items-center gap-2">✅ Verified badge</li>
                    <li className="flex items-center gap-2">
                      ✅ Boost up to 600 Posts
                    </li>
                    <li className="flex items-center gap-2">
                      ✅ Boost up to 400 Pages
                    </li>
                    <li className="flex items-center gap-2 font-semibold">
                      🛡 All Permissions
                    </li>
                  </ul>
                  <p className="text-sm text-gray-600 mb-4">
                    A VVIP USER, POWERFUL PORTFOLIO
                  </p>
                  <button className="bg-red-500 w-full text-white rounded-full px-6 py-2 hover:bg-red-600 transition">
                    Buy Now
                  </button>
                </div>
              </div>
            )} */}
          </main>
        </div>
      </div>
    </div>
  );
}
