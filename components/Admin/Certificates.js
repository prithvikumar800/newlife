import React, { useState, useEffect, useRef } from "react";
import { firebase } from "../../Firebase/config";
import PDF from '../../components/PDF'
import { FiTrash2,FiX } from "react-icons/fi";
const Certificates = () => {
    const [fetchedData, setFetchedData] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const componentRef = useRef();
    const [loading, setLoading] = useState(true);
    const [showPopup, setShowPopup] = useState(false);
    const [selectedCertificate, setSelectedCertificate] = useState(null);
    const [selectedData, setSelectedData] = useState(null)
    const [isModalOpenPDF, setIsModalOpenPDF] = useState(false);
    useEffect(() => {
        const fetchDataFromFirestore = async () => {
            const db = firebase.firestore();
            try {
                const snapshot = await db.collection("certificate").get();
                const data = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setFetchedData(data);
            } catch (error) {
                console.error("Error fetching data: ", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDataFromFirestore();
    }, []);

    const uniqueCategories = [...new Set(fetchedData.map((item) => item.certificateCategory))];
    const filteredData = selectedCategory ? fetchedData.filter((item) => item.certificateCategory === selectedCategory) : fetchedData;

    const handleViewPDF = (data) => {
        setSelectedCertificate(data);
        setShowPopup(true);
    };

    const closePopup = () => {
        setShowPopup(false);
        setSelectedCertificate(null);
    };

    return (
        <div className="p-6">
            {loading ? (
                <div className="flex justify-center items-center h-screen">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
                </div>
            ) : (
                <>
                    <div className="mb-5 flex flex-wrap gap-3">
                        <button onClick={() => setSelectedCategory(null)} className={`px-4 py-2 rounded-lg text-sm font-medium ${selectedCategory === null ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800 hover:bg-gray-300"}`}>Show All</button>
                        {uniqueCategories.map((category) => (
                            <button key={category} onClick={() => setSelectedCategory(category)} className={`px-4 py-2 rounded-lg text-sm uppercase font-medium ${selectedCategory === category ? "bg-blue-600 uppercase text-white" : "bg-gray-200 text-gray-800 hover:bg-gray-300"}`}>{category}</button>
                        ))}
                    </div>

                    <table className="w-full border-collapse border border-gray-300">
                        <thead>
                            <tr className="bg-gray-200">
                                <th className="border border-gray-300 px-4 py-2">Title</th>
                                <th className="border border-gray-300 px-4 py-2">Material Code</th>
                                <th className="border border-gray-300 px-4 py-2">Lot No.</th>
                                <th className="border border-gray-300 px-4 py-2">Mfg Date</th>
                                <th className="border border-gray-300 px-4 py-2">Expiry Date</th>
                                <th className="border border-gray-300 px-4 py-2">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.map((data) => (
                                <tr key={data.id} className="border border-gray-300 text-center">
                                    <td className="border border-gray-300 px-4 py-2 uppercase">{data.certificateTitle}</td>
                                    <td className="border border-gray-300 px-4 py-2 uppercase">{data.materialCode}</td>
                                    <td className="border border-gray-300 px-4 py-2 uppercase">{data.lotno}</td>
                                    <td className="border border-gray-300 px-4 py-2">{data.mfgDate}</td>
                                    <td className="border border-gray-300 px-4 py-2">{data.expiryDate}</td>
                                    <td className="border border-gray-300 px-4 py-2">
                                        <button    onClick={() => {
      setSelectedData(data);
      setIsModalOpenPDF(true);
    }} className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700">View PDF</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </>
            )}

{isModalOpenPDF && selectedData && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg w-full h-[100vh] overflow-y-auto relative">
            <button
              onClick={() => setIsModalOpenPDF(false)}
              className="absolute top-4  right-4 text-red-500 font-bold hover:text-red-700"
            >
              <FiX size={32} />
            </button>
            <PDF data={selectedData} />
          </div>
        </div>
      )}
        </div>
    );
};

export default Certificates;
