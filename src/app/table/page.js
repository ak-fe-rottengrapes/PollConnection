"use client"
import React, { useEffect, useState } from 'react'
import axios from 'axios';
import DataTable from 'react-data-table-component';
import JSZip from 'jszip';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const TableData = () => {
    const [data, setData] = useState([]);
    const [startDate, setStartDate] = useState('2024-07-19');
    const [endDate, setEndDate] = useState('2024-07-21');
    const [interval, setInterval] = useState(4);

    const columns = [
        {
            name: 'ID',
            selector: row => row.id,
            sortable: true,
        },
        {
            name: 'Rare ID',
            selector: row => row.rareid,
            sortable: true,
        },
        {
            name: 'qgs_fid',
            selector: row => row.qgs_fid,
            sortable: true,
        },
        {
            name: 'geom',
            selector: row => row.geom,
            sortable: true,
        },
        {
            name: 'Height',
            selector: row => row.height,
            sortable: true,
        },
        {
            name: 'Girth',
            selector: row => row.girth,
            sortable: true,
        },
        {
            name: 'Latitude',
            selector: row => row.latitude,
            sortable: true,
        },
        {
            name: 'Longitude',
            selector: row => row.longitude,
            sortable: true,
        },
        {
            name: 'Altitude',
            selector: row => row.altitude,
            sortable: true,
        },
        {
            name: 'Accuracy',
            selector: row => row.accuracy,
            sortable: true,
        },
        {
            name: 'Rare Species Name',
            selector: row => row.rare_species_name,
            sortable: true,
        },
        {
            name: 'Rare Species Other Name',
            selector: row => row.rare_species_other_name,
            sortable: true,
        },
        {
            name: 'UID',
            selector: row => row.uid,
            sortable: true,
        },
        {
            name: 'Description',
            selector: row => row.description,
            sortable: true,
        },
        {
            name: 'IsDelete',
            selector: row => row.isDelete,
            sortable: true,
        },
        {
            name: 'Level',
            selector: row => row.Level,
            sortable: true,
        },
        {
            name: 'isActive',
            selector: row => row.isActive,
            sortable: true,
        },
        {
            name: 'createdAt',
            selector: row => row.createdAt,
            sortable: true,
        },
        {
            name: 'updatedAt',
            selector: row => row.updatedAt,
            sortable: true,
        },
        {
            name: 'Date',
            selector: row => row.dateString,
            sortable: true,
        },
        {
            name: 'Time Interval',
            selector: row => row.timeInterval,
            sortable: true,
        }
    ];

    const convertToCSV = async () => {
        const COLUMNS_PER_FILE = 10;
        
        if (columns.length <= COLUMNS_PER_FILE) {
            const headers = columns.map(col => col.name).join(',');
            const rows = data.map(row => 
                columns.map(col => {
                    try {
                        const selectorString = col.selector.toString();
                        const fieldName = selectorString.includes('.')
                            ? selectorString.split('.').pop().replace(/[^a-zA-Z0-9_]/g, '')
                            : selectorString;
                        
                        const value = row[fieldName];
                        if (value === null || value === undefined || value === '') {
                            return '';
                        }
                        return typeof value === 'string' && value.includes(',') 
                            ? `"${value}"` 
                            : value;
                    } catch (error) {
                        return '';
                    }
                }).join(',')
            );
    
            const csv = [headers, ...rows].join('\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `table-data-${startDate}-to-${endDate}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            return;
        }
    
        const zip = new JSZip();
        
        // Split columns into chunks of 10
        for (let i = 0; i < columns.length; i += COLUMNS_PER_FILE) {
            const columnChunk = columns.slice(i, i + COLUMNS_PER_FILE);
            const fileIndex = Math.floor(i / COLUMNS_PER_FILE) + 1;
    
            const headers = columnChunk.map(col => col.name).join(',');
            const rows = data.map(row => 
                columnChunk.map(col => {
                    try {
                        const selectorString = col.selector.toString();
                        const fieldName = selectorString.includes('.')
                            ? selectorString.split('.').pop().replace(/[^a-zA-Z0-9_]/g, '')
                            : selectorString;
                        
                        const value = row[fieldName];
                        if (value === null || value === undefined || value === '') {
                            return '';
                        }
                        return typeof value === 'string' && value.includes(',') 
                            ? `"${value}"` 
                            : value;
                    } catch (error) {
                        return '';
                    }
                }).join(',')
            );
    
            const csv = [headers, ...rows].join('\n');
            zip.file(`table-data-${startDate}-to-${endDate}-part${fileIndex}.csv`, csv);
        }
    
        const content = await zip.generateAsync({ type: "blob" });
        const url = window.URL.createObjectURL(content);
        const a = document.createElement('a');
        a.href = url;
        a.download = `table-data-${startDate}-to-${endDate}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };
    const convertToExcel = async () => {
        const COLUMNS_PER_FILE = 10;

        // If we have 10 or fewer columns, create a single file
        if (columns.length <= COLUMNS_PER_FILE) {
            const worksheetData = data.map(row => {
                const newRow = {};
                columns.forEach(col => {
                    const fieldName = col.name;
                    const value = row[col.selector.toString().split('.').pop().replace(/[^a-zA-Z0-9_]/g, '')];
                    newRow[fieldName] = value;
                });
                return newRow;
            });

            const worksheet = XLSX.utils.json_to_sheet(worksheetData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Table Data");
            XLSX.writeFile(workbook, `table-data-${startDate}-to-${endDate}.xlsx`);
            return;
        }

        const zip = new JSZip();
        
        // Split into multiple files based on columns
        for (let i = 0; i < columns.length; i += COLUMNS_PER_FILE) {
            const columnChunk = columns.slice(i, i + COLUMNS_PER_FILE);
            const fileIndex = Math.floor(i / COLUMNS_PER_FILE) + 1;
            
            const worksheetData = data.map(row => {
                const newRow = {};
                columnChunk.forEach(col => {
                    const fieldName = col.name;
                    const value = row[col.selector.toString().split('.').pop().replace(/[^a-zA-Z0-9_]/g, '')];
                    newRow[fieldName] = value;
                });
                return newRow;
            });

            const workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.json_to_sheet(worksheetData);
            XLSX.utils.book_append_sheet(workbook, worksheet, "Table Data");
            
            const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
            zip.file(`table-data-${startDate}-to-${endDate}-part${fileIndex}.xlsx`, excelBuffer);
        }

        const content = await zip.generateAsync({ type: "blob" });
        const url = window.URL.createObjectURL(content);
        const a = document.createElement('a');
        a.href = url;
        a.download = `table-data-${startDate}-to-${endDate}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    const convertToPDF = async () => {
        const COLUMNS_PER_FILE = 10;
        const margin = 10;
        const startY = 20;

        if (columns.length <= COLUMNS_PER_FILE) {
            const doc = new jsPDF();
            doc.setFontSize(16);
            doc.text(`Table Data (${startDate} to ${endDate})`, margin, startY);

            const tableHeaders = columns.map(col => col.name);
            const tableData = data.map(row =>
                columns.map(col => {
                    const value = row[col.selector.toString().split('.').pop().replace(/[^a-zA-Z0-9_]/g, '')];
                    return value !== null && value !== undefined ? value.toString() : '';
                })
            );

            doc.autoTable({
                head: [tableHeaders],
                body: tableData,
                startY: startY + 10,
                margin: { top: margin },
                theme: 'grid'
            });

            doc.save(`table-data-${startDate}-to-${endDate}.pdf`);
            return;
        }

        const zip = new JSZip();
        
        for (let i = 0; i < columns.length; i += COLUMNS_PER_FILE) {
            const columnChunk = columns.slice(i, i + COLUMNS_PER_FILE);
            const fileIndex = Math.floor(i / COLUMNS_PER_FILE) + 1;
            
            const doc = new jsPDF();
            doc.setFontSize(16);
            doc.text(`Table Data (${startDate} to ${endDate}) - Part ${fileIndex}`, margin, startY);
            
            const tableHeaders = columnChunk.map(col => col.name);
            const tableData = data.map(row =>
                columnChunk.map(col => {
                    const value = row[col.selector.toString().split('.').pop().replace(/[^a-zA-Z0-9_]/g, '')];
                    return value !== null && value !== undefined ? value.toString() : '';
                })
            );

            doc.autoTable({
                head: [tableHeaders],
                body: tableData,
                startY: startY + 10,
                margin: { top: margin },
                theme: 'grid'
            });

            const pdfBuffer = doc.output('arraybuffer');
            zip.file(`table-data-${startDate}-to-${endDate}-part${fileIndex}.pdf`, pdfBuffer);
        }

        const content = await zip.generateAsync({ type: "blob" });
        const url = window.URL.createObjectURL(content);
        const a = document.createElement('a');
        a.href = url;
        a.download = `table-data-${startDate}-to-${endDate}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    const fetchTableData = async () => {
        try {
            const response = await axios.get("/api/tableData", {
                params: {
                    startDate,
                    endDate,
                    interval
                }
            });
            setData(response.data.data);
        } catch (error) {
            console.error("Error fetching data: ", error);
        }
    }

    useEffect(() => {
        fetchTableData();
    }, []);

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Table Data</h1>

            <div className="mb-4 flex flex-col sm:flex-row gap-4">
                <div className='grid grid-cols-2 md:grid-cols-1'>
                    <label className="block text-sm font-medium mb-1">Start Date</label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="border rounded p-2"
                    />
                </div>

                <div className='grid grid-cols-2 md:grid-cols-1'>
                    <label className="block text-sm font-medium mb-1">End Date</label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="border rounded p-2"
                    />
                </div>

                <div className='grid grid-cols-2 md:grid-cols-1'>
                    <label className="block text-sm font-medium mb-1">Interval</label>
                    <input
                        type="number"
                        value={interval}
                        onChange={(e) => setInterval(e.target.value)}
                        className="border rounded p-2"
                        min="1"
                    />
                </div>

                <div className="flex gap-2">
                    <button 
                        onClick={fetchTableData}
                        className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600 mr-2"
                    >
                        Apply Filters
                    </button>
                    <button 
                        onClick={convertToCSV}
                        className="bg-green-500 text-white px-4 py-1 rounded hover:bg-green-600 mr-2"
                    >
                        Download CSV
                    </button>
                    <button 
                        onClick={convertToExcel}
                        className="bg-yellow-500 text-white px-4 py-1 rounded hover:bg-yellow-600 mr-2"
                    >
                        Download Excel
                    </button>
                    <button 
                        onClick={convertToPDF}
                        className="bg-red-500 text-white px-4 py-1 rounded hover:bg-red-600"
                    >
                        Download PDF
                    </button>
                </div>
            </div>

            <DataTable
                columns={columns}
                data={data}
                pagination
                responsive
                highlightOnHover
                striped
                defaultSortFieldId={1}
            />
        </div>
    )
}

export default TableData