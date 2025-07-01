import React, { useState, useEffect, useRef } from "react";
import { FiTrash2, FiX, FiPlus, FiMinus } from "react-icons/fi";
import { firebase } from '../../Firebase/config';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import PDF from '../../components/PDF';

function SearchableSelect({ fetchedData, value, onChange }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef(null);

  const uniqueCategories = ['None', ...new Set(fetchedData?.map(item => item.certificateCategory))];
  const filteredCategories = uniqueCategories.filter(category =>
    category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(event) {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={selectRef}>
      <div
        className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:border-teal-600 peer cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        {value || "Select a category"}
      </div>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          <div className="p-2 border-b">
            <input
              type="text"
              placeholder="Search categories..."
              className="w-full p-2 text-sm border rounded focus:outline-none focus:border-teal-600"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>

          <div className="max-h-10 overflow-y-auto">
            {filteredCategories.length > 0 ? (
              filteredCategories.map((category, index) => (
                <div
                  key={index}
                  className={`p-2 text-sm cursor-pointer hover:bg-gray-100 ${
                    value === category ? 'bg-teal-50 text-teal-600' : ''
                  }`}
                  onClick={() => {
                    onChange(category);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                >
                  {category}
                </div>
              ))
            ) : (
              <div className="p-2 text-sm text-gray-500">No categories found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const Dashboard = ({ userData, loading }) => {
  const [rows, setRows] = useState([
    { 
      titleName: "", 
      subtitles: [{ 
        name: "",
        result: "",
        theoretical: ""
      }],
      result: "", 
      theoretical: "" 
    },
  ]);
  
  const [certificateData, setCertificateData] = useState({
    certificateCategory: "None",
    certificateTitle: "",
    materialCode: "",
    lotno: "",
    mfgDate: "",
    expiryDate: "",
    customCategory: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedData, setSelectedData] = useState(null);
  const [isModalOpenPDF, setIsModalOpenPDF] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fetchedData, setFetchedData] = useState(null);
  const [editId, setEditId] = useState(null);

  const addRow = () => {
    setRows([
      ...rows,
      { 
        titleName: "", 
        subtitles: [{ 
          name: "",
          result: "",
          theoretical: ""
        }],
        result: "", 
        theoretical: "" 
      },
    ]);
  };

  const removeRow = (index) => {
    const updatedRows = rows.filter((_, idx) => idx !== index);
    setRows(updatedRows);
  };

  const addSubtitle = (rowIndex) => {
    const updatedRows = [...rows];
    updatedRows[rowIndex].subtitles.push({ 
      name: "",
      result: "",
      theoretical: ""
    });
    setRows(updatedRows);
  };

  const removeSubtitle = (rowIndex, subtitleIndex) => {
    const updatedRows = [...rows];
    updatedRows[rowIndex].subtitles.splice(subtitleIndex, 1);
    setRows(updatedRows);
  };

  const handleInputChange = (index, field, value) => {
    const updatedRows = rows.map((row, idx) => {
      if (idx === index) {
        return { ...row, [field]: value };
      }
      return row;
    });
    setRows(updatedRows);
  };

  const handleSubtitleChange = (rowIndex, subtitleIndex, field, value) => {
    const updatedRows = [...rows];
    updatedRows[rowIndex].subtitles[subtitleIndex][field] = value;
    setRows(updatedRows);
  };

  const handleCertificateDataChange = (field, value) => {
    setCertificateData((prev) => ({
      ...prev,
      [field]: value,
      ...(field === "certificateCategory" && value !== "None" ? { customCategory: "" } : {}), 
    }));
  
    if (field === "certificateCategory") {
      const selectedCategoryData = fetchedData?.find(
        (item) => item.certificateCategory === value
      );
      
      if (selectedCategoryData?.rows?.length) {
        const rowsWithEmptyResult = selectedCategoryData.rows.map(row => ({
          ...row,
          result: "",
          theoretical: "",
          subtitles: row.subtitles?.map(subtitle => ({
            name: subtitle.name || "",
            result: "",
            theoretical: subtitle.theoretical || ""
          })) || (row.subtitleName ? [{ 
            name: row.subtitleName, 
            result: "",
            theoretical: row.theoretical || ""
          }] : [{ 
            name: "", 
            result: "",
            theoretical: "" 
          }])
        }));
        setRows(rowsWithEmptyResult);
      } else {
        setRows([{ 
          titleName: "", 
          subtitles: [{ 
            name: "",
            result: "",
            theoretical: ""
          }],
          result: "", 
          theoretical: "" 
        }]);
      }
    }
  };
  
  const handleEdit = (data) => {
    setCertificateData({ ...data });
    
    const transformedRows = data.rows.map(row => {
      if (row.subtitles) {
        return {
          ...row,
          subtitles: row.subtitles.map(subtitle => ({
            name: subtitle.name || "",
            result: subtitle.result || "",
            theoretical: subtitle.theoretical || ""
          }))
        };
      }
      return {
        ...row,
        subtitles: row.subtitleName ? [{ 
          name: row.subtitleName, 
          result: row.result || "",
          theoretical: row.theoretical || ""
        }] : [{ 
          name: "", 
          result: "",
          theoretical: "" 
        }]
      };
    });
    
    setRows(transformedRows);
    setEditId(data.id);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
  
    if (!certificateData.materialCode || !certificateData.mfgDate || !certificateData.certificateTitle) {
      toast.error("Material Code, Manufacturing Date, and Certificate Title are required!");
      setIsSubmitting(false);
      return;
    }
  
    // Validate all results (both row-level and subtitle-level)
    for (const row of rows) {
      // Validate row-level result if it exists
      if (row.theoretical && row.result) {
        const theoreticalRange = row.theoretical.match(/(\d+)-(\d+)/);
        if (theoreticalRange) {
          const min = parseInt(theoreticalRange[1], 10);
          const max = parseInt(theoreticalRange[2], 10);
  
          const resultRange = row.result.match(/(\d+)-(\d+)/);
          if (resultRange) {
            const resultMin = parseInt(resultRange[1], 10);
            const resultMax = parseInt(resultRange[2], 10);
  
            if (isNaN(resultMin)) {
              toast.error("Result must be a valid number!");
              setIsSubmitting(false);
              return;
            }
  
            if (resultMin < min || resultMax > max) {
              toast.error(`Result must be between ${min} and ${max}`);
              setIsSubmitting(false);
              return;
            }
          } else {
            const resultValue = parseInt(row.result.replace(/\D/g, ''), 10);
  
            if (isNaN(resultValue)) {
              toast.error("Result must be a valid number!");
              setIsSubmitting(false);
              return;
            }
  
            if (resultValue < min || resultValue > max) {
              toast.error(`Result must be between ${min} and ${max}`);
              setIsSubmitting(false);
              return;
            }
          }
        }
      }
  
      // Validate subtitle-level results
      for (const subtitle of row.subtitles) {
        if (subtitle.theoretical && subtitle.result) {
          const theoreticalRange = subtitle.theoretical.match(/(\d+)-(\d+)/);
          if (theoreticalRange) {
            const min = parseInt(theoreticalRange[1], 10);
            const max = parseInt(theoreticalRange[2], 10);
  
            const resultRange = subtitle.result.match(/(\d+)-(\d+)/);
            if (resultRange) {
              const resultMin = parseInt(resultRange[1], 10);
              const resultMax = parseInt(resultRange[2], 10);
  
              if (isNaN(resultMin)) {
                toast.error("Subtitle result must be a valid number!");
                setIsSubmitting(false);
                return;
              }
  
              if (resultMin < min || resultMax > max) {
                toast.error(`Subtitle result must be between ${min} and ${max}`);
                setIsSubmitting(false);
                return;
              }
            } else {
              const resultValue = parseInt(subtitle.result.replace(/\D/g, ''), 10);
  
              if (isNaN(resultValue)) {
                toast.error("Subtitle result must be a valid number!");
                setIsSubmitting(false);
                return;
              }
  
              if (resultValue < min || resultValue > max) {
                toast.error(`Subtitle result must be between ${min} and ${max}`);
                setIsSubmitting(false);
                return;
              }
            }
          }
        }
      }
    }
  
    const formattedMfgDate = new Date(certificateData.mfgDate);
    if (isNaN(formattedMfgDate)) {
      toast.error("Invalid manufacturing date!");
      setIsSubmitting(false);
      return;
    }
  
    const day = String(formattedMfgDate.getDate()).padStart(2, "0");
    const month = String(formattedMfgDate.getMonth() + 1).padStart(2, "0");
    const year = formattedMfgDate.getFullYear();
  
    const generatedLotNo = `${certificateData.materialCode}${day}${month}${year.toString().slice(-2)}`;
  
    const updatedData = { ...certificateData, lotno: generatedLotNo };
  
    const finalCategory = certificateData.certificateCategory !== "None"
      ? certificateData.certificateCategory
      : certificateData.customCategory || "";
  
    if (certificateData.certificateCategory === "None" && !certificateData.customCategory) {
      toast.error("Please enter a custom category!");
      setIsSubmitting(false);
      return;
    }
  
    const certificateDetails = {
      ...updatedData,
      certificateCategory: finalCategory,
      customCategory: "",
      rows,
      employeename: userData?.name,
      employemobile: userData?.mobile,
      employeeid: userData?.uid,
      Verified: "False",
    };
  
    try {
      const db = firebase.firestore();
      if (editId) {
        await db.collection("certificate").doc(editId).update(certificateDetails);
        toast.success("Certificate updated successfully!");
      } else {
        await db.collection("certificate").add(certificateDetails);
        toast.success("Certificate created successfully!");
      }
  
      setIsModalOpen(false);
      fetchDataFromFirestore();
    } catch (error) {
      console.error("Error submitting certificate: ", error);
      toast.error("There was an error submitting the certificate.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const fetchDataFromFirestore = async () => {
    const db = firebase.firestore();
    try {
      const snapshot = await db.collection("certificate").get();
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setFetchedData(data);
    } catch (error) {
      console.error("Error fetching data: ", error);
      toast.error("There was an error fetching the data.");
    }
  };

  useEffect(() => {
    fetchDataFromFirestore();
  }, []);

  const handleVerificationChange = async (certificateId, verifiedStatus) => {
    const db = firebase.firestore();
    try {
      await db.collection("certificate").doc(certificateId).update({
        Verified: verifiedStatus,
      });
      toast.success("Verification status updated successfully!");
      fetchDataFromFirestore();
    } catch (error) {
      console.error("Error updating verification status: ", error);
      toast.error("There was an error updating the verification status.");
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCertificateData({
      certificateCategory: "None",
      certificateTitle: "",
      materialCode: "",
      lotno: "",
      mfgDate: "",
      expiryDate: "",
      customCategory: "",
    });
    setRows([{ 
      titleName: "", 
      subtitles: [{ 
        name: "",
        result: "",
        theoretical: ""
      }],
      result: "", 
      theoretical: "" 
    }]);
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this certificate?");
    if (!confirmDelete) return;
  
    try {
      const docRef = firebase.firestore().collection("certificate").doc(id);
      const docSnap = await docRef.get();
  
      if (!docSnap.exists) {
        toast.error("Certificate not found in database");
        return;
      }
  
      await docRef.delete();
      toast.success("Certificate deleted successfully");
      setFetchedData((prevData) => prevData.filter((item) => item.id !== id));
    } catch (error) {
      console.error("Error deleting certificate:", error);
      toast.error("Failed to delete certificate");
    }
  };

  const filteredData = (fetchedData && Array.isArray(fetchedData)) 
    ? fetchedData.filter((data) =>
        data.lotno?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="spinner-border animate-spin inline-block w-16 h-16 border-4 rounded-full border-t-blue-500 border-gray-200"></div>
      </div>
    );
  }
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  };
  
  return (
    <div>
      <div className="w-full bg-gradient-to-r from-blue-50 to-blue-100 p-8 shadow-xl">
        <h1 className="md:text-4xl text-xl font-semibold text-center text-blue-600 mb-6">Welcome, {userData?.name}</h1>
        <div className="space-y-6">
          <div className="flex justify-between items-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 ease-in-out">
            <span className="font-semibold text-gray-700">Name:</span>
            <span className="text-gray-900">{userData?.name}</span>
          </div>
          <div className="flex justify-between items-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 ease-in-out">
            <span className="font-semibold text-gray-700">Email:</span>
            <span className="text-gray-900">{userData?.email}</span>
          </div>
          <div className="flex justify-between items-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 ease-in-out">
            <span className="font-semibold text-gray-700">Mobile Number:</span>
            <span className="text-gray-900">{userData?.mobile}</span>
          </div>
        </div>
      </div>

      <div className="min-h-screen bg-white flex px-4">
        <button
          onClick={() => setIsModalOpen((prev) => !prev)}
          className={`fixed bottom-20 right-4 ${
            isModalOpen ? "bg-red-600" : "bg-teal-600"
          } text-white py-3 px-6 rounded-full shadow-lg hover:opacity-90 focus:outline-none transition duration-200`}
        >
          {isModalOpen ? "Close" : "Create Certificate"}
        </button>

        <div className="w-full bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-semibold text-center text-teal-600 mb-6">
            Certificate Data
          </h1>
          <ToastContainer />
          <input
            type="text"
            placeholder="Search by Lot No."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-4 p-2 border rounded w-full"
          />
          {filteredData && filteredData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto border-collapse bg-white">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-bold text-gray-700 border-b">Certificate Title</th>
                    <th className="px-4 py-2 text-left text-sm font-bold text-gray-700 border-b">Employee Name</th>
                    <th className="px-4 py-2 text-left text-sm font-bold text-gray-700 border-b">Material Code</th>
                    <th className="px-4 py-2 text-left text-sm font-bold text-gray-700 border-b">Expiry Date</th>
                    <th className="px-4 py-2 text-left text-sm font-bold text-gray-700 border-b">Lot Number</th>
                    <th className="px-4 py-2 text-left text-sm font-bold text-gray-700 border-b">Verification Status</th>
                    <th className="px-4 py-2 text-left text-sm font-bold text-gray-700 border-b">Verify Status</th>
                    <th className="px-4 py-2 text-left text-sm font-bold text-gray-700 border-b">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((data, index) => (
                    <tr key={index} className="hover:bg-teal-50">
                      <td className="px-4 py-2 text-sm text-gray-600 border-b uppercase">{index + 1}.{data.certificateTitle}</td>
                      <td className="px-4 py-2 text-sm text-gray-600 border-b uppercase">{data.employeename}</td>
                      <td className="px-4 py-2 text-sm text-gray-600 border-b uppercase">{data.materialCode}</td>
                      <td className="px-4 py-2 text-sm text-gray-600 border-b uppercase">{data.expiryDate}</td>
                      <td className="px-4 py-2 text-sm text-gray-600 border-b uppercase">{data.lotno}</td>
                      <td className="px-4 py-2 text-sm text-gray-600 border-b uppercase">
                        {data.Verified === 'True' ? (
                          <span className="text-green-600 font-semibold">Verified</span>
                        ) : (
                          <span className="text-red-600 font-semibold">Pending</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-600 border-b uppercase">
                        <select
                          value={data.Verified}
                          onChange={(e) => handleVerificationChange(data.id, e.target.value)}
                          className="border p-2 rounded-md"
                        >
                          <option value="True">True</option>
                          <option value="False">False</option>
                        </select>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-600 border-b uppercase">
                        <button
                          onClick={() => {
                            setSelectedData(data);
                            setIsModalOpenPDF(true);
                          }}
                          className="text-teal-600 hover:text-teal-800"
                        >
                          View PDF
                        </button>
                        <button
                          onClick={() => handleEdit(data)}
                          className="text-teal-600 ml-4 uppercase hover:text-teal-800"
                        >
                          Edit
                        </button>
                        <button
                          className="mt-2 ml-4 bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                          onClick={() => handleDelete(data.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-gray-600">No certificate data found.</p>
          )}
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-50 z-50">
            <div className="bg-white rounded-md shadow-lg w-full h-full p-8 overflow-y-auto">
              <button
                type="button"
                onClick={handleCloseModal}
                className="absolute top-4 right-4 font-bold text-red-600 hover:text-red-800"
              >
                <FiX size={32} />
              </button>
              <h2 className="text-3xl font-bold text-teal-800 mb-6 text-center">
                Add Certificate Details
              </h2>
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:mb-24">
                  <div className="relative z-0 w-full group mb-16 md:mb-0">
                    <div className="relative">
                      <SearchableSelect
                        fetchedData={fetchedData}
                        value={certificateData.certificateCategory}
                        onChange={(value) => handleCertificateDataChange('certificateCategory', value)}
                      />
                    </div>
                    <label
                      htmlFor="certificateCategory"
                      className="absolute text-sm text-gray-500 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] left-0 peer-focus:left-0 peer-focus:text-teal-600 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:translate-y-[-20px] peer-focus:scale-75 transition-all duration-200"
                    >
                      Certificate Category
                    </label>
                    {certificateData.certificateCategory === "None" && (
                      <input
                        type="text"
                        id="customCategory"
                        className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:border-teal-600 peer"
                        placeholder="Enter custom category"
                        value={certificateData.customCategory || ""}
                        onChange={(e) => handleCertificateDataChange('customCategory', e.target.value)}
                      />
                    )}
                  </div>
                  <div className="relative z-0 w-full group">
                    <input
                      type="text"
                      id="certificateTitle"
                      className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:border-teal-600 peer"
                      placeholder=" "
                      value={certificateData.certificateTitle}
                      onChange={(e) => handleCertificateDataChange('certificateTitle', e.target.value)}
                    />
                    <label
                      htmlFor="certificateTitle"
                      className="absolute text-sm text-gray-500 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] left-0 peer-focus:left-0 peer-focus:text-teal-600 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:translate-y-[-20px] peer-focus:scale-75 transition-all duration-200"
                    >
                      Certificate Title
                    </label>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="relative z-0 w-full group">
                    <input
                      type="text"
                      id="materialCode"
                      className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:border-teal-600 peer"
                      placeholder=" "
                      value={certificateData.materialCode}
                      onChange={(e) => handleCertificateDataChange('materialCode', e.target.value)}
                    />
                    <label
                      htmlFor="materialCode"
                      className="absolute text-sm text-gray-500 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] left-0 peer-focus:left-0 peer-focus:text-teal-600 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:translate-y-[-20px] peer-focus:scale-75 transition-all duration-200"
                    >
                      Material Code
                    </label>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="relative z-0 w-full group">
                    <input
                      type="date"
                      id="mfgDate"
                      value={certificateData.mfgDate}
                      onChange={(e) => handleCertificateDataChange('mfgDate', e.target.value)}
                      className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:border-teal-600 peer"
                      placeholder=" "
                    />
                    <label
                      htmlFor="mfgDate"
                      className="absolute text-sm text-gray-500 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] left-0 peer-focus:left-0 peer-focus:text-teal-600 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:translate-y-[-20px] peer-focus:scale-75 transition-all duration-200"
                    >
                      Manufacturing Date
                    </label>
                  </div>
                  <div className="relative z-0 w-full group">
                    <input
                      type="date"
                      id="expiryDate"
                      value={certificateData.expiryDate}
                      onChange={(e) => handleCertificateDataChange('expiryDate', e.target.value)}
                      className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:border-teal-600 peer"
                      placeholder=" "
                    />
                    <label
                      htmlFor="expiryDate"
                      className="absolute text-sm text-gray-500 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] left-0 peer-focus:left-0 peer-focus:text-teal-600 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:translate-y-[-20px] peer-focus:scale-75 transition-all duration-200"
                    >
                      Expiry Date
                    </label>
                  </div>
                </div>

                {/* Table Section */}
                <div className="overflow-x-auto mb-6">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-teal-50">
                        <th className="border text-center border-gray-300 px-4 py-2 text-teal-800">Title/Subtitle</th>
                        <th className="border text-center border-gray-300 px-4 py-2 text-teal-800">Result</th>
                        <th className="border text-center border-gray-300 px-4 py-2 text-teal-800">Theoretical Results</th>
                        <th className="border text-center border-gray-300 px-4 py-2 text-teal-800">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, rowIndex) => (
                        <React.Fragment key={rowIndex}>
                          {/* Main Row */}
                          <tr>
                            <td className="border border-gray-300 px-4 py-2">
                              <input
                                type="text"
                                placeholder="Enter Title Name"
                                className="block py-2 px-3 w-full text-sm text-gray-900 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                                value={row.titleName}
                                onKeyDown={handleKeyDown}
                                onChange={(e) =>
                                  handleInputChange(rowIndex, "titleName", e.target.value)
                                }
                              />
                            </td>
                            <td className="border border-gray-300 px-4 py-2">
                              <input
                                type="text"
                                placeholder="Enter Results"
                                className="block py-2 px-3 w-full text-sm text-gray-900 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                                value={row.result}
                                onKeyDown={handleKeyDown}
                                onChange={(e) =>
                                  handleInputChange(rowIndex, "result", e.target.value)
                                }
                              />
                            </td>
                            <td className="border border-gray-300 px-4 py-2">
                              <input
                                type="text"
                                placeholder="Enter Theoretical Results"
                                className="block py-2 px-3 w-full text-sm text-gray-900 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                                value={row.theoretical}
                                onKeyDown={handleKeyDown}
                                onChange={(e) =>
                                  handleInputChange(rowIndex, "theoretical", e.target.value)
                                }
                              />
                            </td>
                            <td className="border border-gray-300 px-4 py-2 text-center">
                              <button
                                type="button"
                                className="text-red-500 hover:text-red-700"
                                onClick={() => removeRow(rowIndex)}
                              >
                                <FiTrash2 size={20} />
                              </button>
                            </td>
                          </tr>
                          
                          {/* Subtitles Rows */}
                          {row.subtitles.map((subtitle, subtitleIndex) => (
                            <tr key={`${rowIndex}-${subtitleIndex}`}>
                              <td className="border border-gray-300 px-4 py-2 pl-8">
                                <div className="flex items-center">
                                  <input
                                    type="text"
                                    placeholder="Enter Subtitle Name"
                                    className="block py-2 px-3 w-full text-sm text-gray-900 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                                    value={subtitle.name}
                                    onKeyDown={handleKeyDown}
                                    onChange={(e) =>
                                      handleSubtitleChange(rowIndex, subtitleIndex, "name", e.target.value)
                                    }
                                  />
                                  {row.subtitles.length > 1 && (
                                    <button
                                      type="button"
                                      className="ml-2 text-red-500 hover:text-red-700"
                                      onClick={() => removeSubtitle(rowIndex, subtitleIndex)}
                                    >
                                      <FiMinus size={16} />
                                    </button>
                                  )}
                                  {subtitleIndex === row.subtitles.length - 1 && (
                                    <button
                                      type="button"
                                      className="ml-2 text-teal-500 hover:text-teal-700"
                                      onClick={() => addSubtitle(rowIndex)}
                                    >
                                      <FiPlus size={16} />
                                    </button>
                                  )}
                                </div>
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                <input
                                  type="text"
                                  placeholder="Enter Subtitle Result"
                                  className="block py-2 px-3 w-full text-sm text-gray-900 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                                  value={subtitle.result}
                                  onKeyDown={handleKeyDown}
                                  onChange={(e) =>
                                    handleSubtitleChange(rowIndex, subtitleIndex, "result", e.target.value)
                                  }
                                />
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                <input
                                  type="text"
                                  placeholder="Enter Subtitle Theoretical"
                                  className="block py-2 px-3 w-full text-sm text-gray-900 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                                  value={subtitle.theoretical}
                                  onKeyDown={handleKeyDown}
                                  onChange={(e) =>
                                    handleSubtitleChange(rowIndex, subtitleIndex, "theoretical", e.target.value)
                                  }
                                />
                              </td>
                              <td className="border border-gray-300 px-4 py-2 text-center">
                                {/* Empty cell for alignment */}
                              </td>
                            </tr>
                          ))}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>

                <button
                  type="button"
                  className="w-full mb-6 py-2 px-4 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition duration-300"
                  onClick={addRow}
                >
                  Add Row
                </button>

                <button
                  type="submit"
                  className="py-2 px-4 bg-teal-600 text-white rounded hover:bg-teal-800"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                </button>
              </form>
            </div>
          </div>
        )}
        {isModalOpenPDF && selectedData && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded-lg w-full h-[100vh] overflow-y-auto relative">
              <button
                onClick={() => setIsModalOpenPDF(false)}
                className="absolute top-4 right-4 text-red-500 font-bold hover:text-red-700"
              >
                <FiX size={32} />
              </button>
              <PDF data={selectedData} />
            </div>
          </div>
        )}
        <ToastContainer />
      </div>
    </div>
  );
};

export default Dashboard;