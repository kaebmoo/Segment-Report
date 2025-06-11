import React, { useState, useRef, useEffect } from 'react';
import { Plus, Download, Upload, Table, FileText, X, Edit2, Save } from 'lucide-react';


const TransferPricingApp = () => {
  // โหลดข้อมูลจาก localStorage เมื่อ component mount
  const [data, setData] = useState(() => {
    try {
      const savedData = localStorage.getItem('transferPricingData');
      return savedData ? JSON.parse(savedData) : [];
    } catch (error) {
      console.error('Error loading data from localStorage:', error);
      return [];
    }
  });
  
  // บันทึกข้อมูลลง localStorage ทุกครั้งที่ data เปลี่ยน
  useEffect(() => {
    try {
      localStorage.setItem('transferPricingData', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving data to localStorage:', error);
    }
  }, [data]);

  const [currentView, setCurrentView] = useState('form');
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    serviceProvider: '',
    serviceName: '',
    price: '',
    serviceReceiver: '',
    quantity: ''
  });
  const [editingIndex, setEditingIndex] = useState(-1);
  const fileInputRef = useRef(null);

  // Sample data for demonstration
  const sampleProviders = ['IT แผนก', 'HR แผนก', 'การเงิน แผนก', 'การตลาด แผนก'];
  const sampleReceivers = ['สำนักงานใหญ่', 'สาขา A', 'สาขา B', 'สาขา C', 'โรงงาน 1', 'โรงงาน 2'];
  const sampleServices = ['บริการ IT Support', 'บริการจัดการทรัพยากรบุคคล', 'บริการทางการเงิน', 'บริการการตลาด', 'บริการปรึกษา'];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = () => {
    if (!formData.serviceName || !formData.serviceProvider || !formData.serviceReceiver || !formData.quantity) {
      alert('กรุณากรอกข้อมูลให้ครบทุกช่อง');
      return;
    }

    const newRecord = {
      id: Date.now(),
      date: formData.date,
      serviceProvider: formData.serviceProvider,
      serviceName: formData.serviceName,
      price: parseFloat(formData.price) || 0,
      serviceReceiver: formData.serviceReceiver,
      quantity: parseFloat(formData.quantity) || 0,
      totalAmount: (parseFloat(formData.price) || 0) * (parseFloat(formData.quantity) || 0)
    };

    if (editingIndex >= 0) {
      const updatedData = [...data];
      updatedData[editingIndex] = newRecord;
      setData(updatedData);
      setEditingIndex(-1);
    } else {
      setData(prev => [...prev, newRecord]);
    }

    setFormData({
      date: new Date().toISOString().split('T')[0],
      serviceProvider: '',
      serviceName: '',
      price: '',
      serviceReceiver: '',
      quantity: ''
    });
  };

  const handleEdit = (index) => {
    const record = data[index];
    setFormData({
      date: record.date,
      serviceProvider: record.serviceProvider,
      serviceName: record.serviceName,
      price: record.price.toString(),
      serviceReceiver: record.serviceReceiver,
      quantity: record.quantity.toString()
    });
    setEditingIndex(index);
    setCurrentView('form');
  };

  const handleDelete = (index) => {
    if (confirm('ต้องการลบรายการนี้หรือไม่?')) {
      setData(prev => prev.filter((_, i) => i !== index));
    }
  };

  const generateCrosstab = () => {
    const crosstab = {};
    
    data.forEach(record => {
      const key = `${record.serviceName}|${record.serviceProvider}|${record.price}`;
      if (!crosstab[key]) {
        crosstab[key] = {
          serviceName: record.serviceName,
          serviceProvider: record.serviceProvider,
          price: record.price,
          receivers: {}
        };
      }
      crosstab[key].receivers[record.serviceReceiver] = 
        (crosstab[key].receivers[record.serviceReceiver] || 0) + record.quantity;
    });

    return Object.values(crosstab);
  };

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        const lines = content.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.trim());
        
        const importedData = [];
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim());
          if (values.length >= 6) {
            importedData.push({
              id: Date.now() + i,
              date: values[0] || new Date().toISOString().split('T')[0],
              serviceProvider: values[1] || '',
              serviceName: values[2] || '',
              price: parseFloat(values[3]) || 0,
              serviceReceiver: values[4] || '',
              quantity: parseFloat(values[5]) || 0,
              totalAmount: (parseFloat(values[3]) || 0) * (parseFloat(values[5]) || 0)
            });
          }
        }
        
        setData(prev => [...prev, ...importedData]);
        alert(`นำเข้าข้อมูลสำเร็จ ${importedData.length} รายการ`);
      } catch (error) {
        alert('เกิดข้อผิดพลาดในการนำเข้าข้อมูล');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleExport = () => {
    if (data.length === 0) {
      alert('ไม่มีข้อมูลสำหรับส่งออก');
      return;
    }

    const headers = ['วันที่', 'หน่วยงานให้บริการ', 'ชื่อบริการ', 'ราคา', 'หน่วยงานรับบริการ', 'จำนวน', 'ยอดรวม'];
    const csvContent = [
      headers.join(','),
      ...data.map(record => [
        record.date,
        record.serviceProvider,
        record.serviceName,
        record.price,
        record.serviceReceiver,
        record.quantity,
        record.totalAmount
      ].join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `transfer_pricing_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const crosstabData = generateCrosstab();
  const allReceivers = [...new Set(data.map(d => d.serviceReceiver))].sort();

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
            ระบบจัดการข้อมูล Transfer Pricing
          </h1>
          
          {/* Navigation */}
          <div className="flex flex-wrap gap-2 mb-6 justify-center">
            <button
              onClick={() => setCurrentView('form')}
              className={`px-3 py-2 sm:px-4 text-xs sm:text-sm rounded-lg font-medium transition-colors ${
                currentView === 'form' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Plus className="inline-block w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">กรอกข้อมูล</span>
              <span className="sm:hidden">เพิ่ม</span>
            </button>
            <button
              onClick={() => setCurrentView('list')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                currentView === 'list' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <FileText className="inline-block w-4 h-4 mr-2" />
              รายการข้อมูล ({data.length})
            </button>
            <button
              onClick={() => setCurrentView('crosstab')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                currentView === 'crosstab' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Table className="inline-block w-4 h-4 mr-2" />
              Crosstab
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              <Upload className="inline-block w-4 h-4 mr-2" />
              นำเข้าข้อมูล
            </button>
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
            >
              <Download className="inline-block w-4 h-4 mr-2" />
              ส่งออกข้อมูล
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleImport}
            className="hidden"
          />
        </div>

        {/* Form View */}
        {currentView === 'form' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              {editingIndex >= 0 ? 'แก้ไขข้อมูล' : 'เพิ่มข้อมูลใหม่'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">วันที่</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">หน่วยงานให้บริการ</label>
                <select
                  value={formData.serviceProvider}
                  onChange={(e) => handleInputChange('serviceProvider', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">เลือกหน่วยงาน</option>
                  {sampleProviders.map(provider => (
                    <option key={provider} value={provider}>{provider}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อบริการ</label>
                <select
                  value={formData.serviceName}
                  onChange={(e) => handleInputChange('serviceName', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">เลือกบริการ</option>
                  {sampleServices.map(service => (
                    <option key={service} value={service}>{service}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ราคาต่อหน่วย (บาท)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">หน่วยงานรับบริการ</label>
                <select
                  value={formData.serviceReceiver}
                  onChange={(e) => handleInputChange('serviceReceiver', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">เลือกหน่วยงาน</option>
                  {sampleReceivers.map(receiver => (
                    <option key={receiver} value={receiver}>{receiver}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">จำนวนการใช้งาน</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.quantity}
                  onChange={(e) => handleInputChange('quantity', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                  required
                />
              </div>

              <div className="sm:col-span-2 lg:col-span-3 flex flex-col sm:flex-row gap-2">
                <button
                  onClick={handleSubmit}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  <Save className="inline-block w-4 h-4 mr-2" />
                  {editingIndex >= 0 ? 'บันทึกการแก้ไข' : 'เพิ่มข้อมูล'}
                </button>
                {editingIndex >= 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingIndex(-1);
                      setFormData({
                        date: new Date().toISOString().split('T')[0],
                        serviceProvider: '',
                        serviceName: '',
                        price: '',
                        serviceReceiver: '',
                        quantity: ''
                      });
                    }}
                    className="px-6 py-3 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors"
                  >
                    <X className="inline-block w-4 h-4 mr-2" />
                    ยกเลิก
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* List View */}
        {currentView === 'list' && (
          <div className="bg-white rounded-lg shadow-lg p-3 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">รายการข้อมูลทั้งหมด</h2>
            {data.length === 0 ? (
              <p className="text-gray-500 text-center py-8">ยังไม่มีข้อมูล</p>
            ) : (
              <>
                {/* Desktop View - แสดงเฉพาะหน้าจอใหญ่ */}
                {/* Desktop View - แสดงเฉพาะหน้าจอใหญ่ */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full table-auto border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-4 py-2 text-left">วันที่</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">หน่วยงานให้บริการ</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">ชื่อบริการ</th>
                        <th className="border border-gray-300 px-4 py-2 text-right">ราคา</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">หน่วยงานรับบริการ</th>
                        <th className="border border-gray-300 px-4 py-2 text-right">จำนวน</th>
                        <th className="border border-gray-300 px-4 py-2 text-right">ยอดรวม</th>
                        <th className="border border-gray-300 px-4 py-2 text-center">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((record, index) => (
                        <tr key={record.id} className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-4 py-2">{record.date}</td>
                          <td className="border border-gray-300 px-4 py-2">{record.serviceProvider}</td>
                          <td className="border border-gray-300 px-4 py-2">{record.serviceName}</td>
                          <td className="border border-gray-300 px-4 py-2 text-right">{record.price.toLocaleString()}</td>
                          <td className="border border-gray-300 px-4 py-2">{record.serviceReceiver}</td>
                          <td className="border border-gray-300 px-4 py-2 text-right">{record.quantity.toLocaleString()}</td>
                          <td className="border border-gray-300 px-4 py-2 text-right">{record.totalAmount.toLocaleString()}</td>
                          <td className="border border-gray-300 px-4 py-2 text-center">
                            <button
                              onClick={() => handleEdit(index)}
                              className="text-blue-600 hover:text-blue-800 mr-2"
                              title="แก้ไข"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(index)}
                              className="text-red-600 hover:text-red-800"
                              title="ลบ"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Mobile View - แสดงเฉพาะหน้าจอเล็ก */}
                <div className="lg:hidden space-y-4">
                  {data.map((record, index) => (
                    <div key={record.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div><span className="font-medium">วันที่:</span> {record.date}</div>
                        <div><span className="font-medium">ราคา:</span> {record.price.toLocaleString()}</div>
                        <div className="col-span-2"><span className="font-medium">ให้บริการ:</span> {record.serviceProvider}</div>
                        <div className="col-span-2"><span className="font-medium">บริการ:</span> {record.serviceName}</div>
                        <div className="col-span-2"><span className="font-medium">รับบริการ:</span> {record.serviceReceiver}</div>
                        <div><span className="font-medium">จำนวน:</span> {record.quantity.toLocaleString()}</div>
                        <div><span className="font-medium">ยอดรวม:</span> {record.totalAmount.toLocaleString()}</div>
                      </div>
                      <div className="flex justify-end gap-2 mt-3">
                        <button
                          onClick={() => handleEdit(index)}
                          className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          แก้ไข
                        </button>
                        <button
                          onClick={() => handleDelete(index)}
                          className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                        >
                          ลบ
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Crosstab View */}
        {currentView === 'crosstab' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">ตารางแสดงข้อมูลแบบ Crosstab</h2>
            {crosstabData.length === 0 ? (
              <p className="text-gray-500 text-center py-8">ยังไม่มีข้อมูลสำหรับแสดงผล</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full table-auto border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-4 py-2 text-left">หน่วยงานให้บริการ</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">ชื่อบริการ</th>
                      <th className="border border-gray-300 px-4 py-2 text-right">ราคา</th>
                      {allReceivers.map(receiver => (
                        <th key={receiver} className="border border-gray-300 px-4 py-2 text-right">
                          {receiver}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {crosstabData.map((row, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-4 py-2">{row.serviceProvider}</td>
                        <td className="border border-gray-300 px-4 py-2">{row.serviceName}</td>
                        <td className="border border-gray-300 px-4 py-2 text-right">{row.price.toLocaleString()}</td>
                        {allReceivers.map(receiver => (
                          <td key={receiver} className="border border-gray-300 px-4 py-2 text-right">
                            {row.receivers[receiver] ? row.receivers[receiver].toLocaleString() : '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TransferPricingApp;