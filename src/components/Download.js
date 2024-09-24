import React, { useState } from 'react';
import { returnDomain } from '../utils/img';

const keeperKeys = [
    'sb','catalog','man','bran','year','circa','surf',
    'thickness','thicknessWord','gloss','glossWord','dmin','dmax','colorWord','roughness','textureWord',
    'expressiveness','auc','processing','backp','toner','resin','postcard'
];

// Define a mapping from the original key to the new header name
const headerNames = {
    'sb': 'IsSampleBook',
    'catalog': 'CatalogNumber',
    'man': 'Manufacturer',
    'bran': 'Brand',
    'year': 'Year',
    'circa': 'DateIsApproximate',
    'surf': 'Surface',
    'thickness': 'Thickness_mm',
    'thicknessWord': 'ThicknessDescription',
    'gloss': 'GlossUnits',
    'glossWord': 'GlossDescription',
    'dmin': 'WarmthAtDmin',
    'dmax': 'WarmthAtDmax',
    'colorWord': 'ColorDescription',
    'roughness': 'Roughness',
    'textureWord': 'TextureDescription',
    'expressiveness': 'Expressiveness',
    'auc': 'Fluorescence',
    'processing': 'HasProcessingInstructions',
    'backp': 'Backprint',
    'toner': 'Toner',
    'resin': 'IsResinCoated',
    'postcard': 'IsPostcard'    
};

const Download = ({ data, idxList, etitle, filename = 'lml.csv' }) => {
    const [showModal, setShowModal] = useState(false);

    const handleDownload = () => {
        setShowModal(false); // Close the modal once the download is initiated

        // Filter headers to include only keeper keys
        const headers = Object.keys(data).filter(key => keeperKeys.includes(key));
        
        // Rename headers according to the headerNames map
        const renamedHeaders = headers.map(header => headerNames[header] || header);

        const csvRows = [renamedHeaders.join(',')]; // First row as renamed headers

        const indices = idxList.length > 0 ? idxList : Array.from({ length: data[headers[0]].length }, (_, i) => i);
    
        // Filter each column's data based on indices
        const filteredData = headers.map(header => (
            indices.map(index => data[header][index])
        ));

        // Determine the number of rows in the filtered data
        const numRows = filteredData[0].length;

        // Construct each row by iterating over the number of filtered rows
        for (let i = 0; i < numRows; i++) {
            const values = headers.map((header, headerIndex) => {
                const value = filteredData[headerIndex][i];
                const escaped = ('' + value).replace(/"/g, '\\"');
                return `"${escaped}"`;
            });
            csvRows.push(values.join(','));
        }

        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv' });
        const link = document.createElement('a');
        link.download = filename;
        link.href = window.URL.createObjectURL(blob);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleModalOpen = () => {
        setShowModal(true);
    };

    const handleModalClose = () => {
        setShowModal(false);
    };

    return (
        <>
            <button title={etitle} className="material-icons downloadButton" onClick={handleModalOpen}>file_download</button>
            {showModal && (
                <div id='downloadTermsModal'>
                    <div id='downloadTermsModalContent'>
                        <h2>Paperbase Terms of Use</h2>
                        <p>Please read the <a href={returnDomain() + "terms.html"} target="_blank">Terms of Use</a> before downloading.</p>
                        <button id='yesreadterms' onClick={handleDownload}>Yes, I have read the terms</button>
                        <button id='noreadterms' onClick={handleModalClose}>No, cancel download</button>
                    </div>
                </div>
            )}
        </>
    );
};

export default Download;
