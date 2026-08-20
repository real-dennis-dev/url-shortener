import { createContext, useContext } from "react";
import useBulkUpload from "../../hooks/useBulkUpload";

const BulkUploadContext = createContext(null);

export function BulkUploadProvider({ children }) {
  const bulkUpload = useBulkUpload();

  return (
    <BulkUploadContext.Provider value={bulkUpload}>
      {children}
    </BulkUploadContext.Provider>
  );
}

export function useBulkUploadContext() {
  const context = useContext(BulkUploadContext);
  if (!context) {
    throw new Error(
      "useBulkUploadContext must be used within a BulkUploadProvider"
    );
  }
  return context;
}
