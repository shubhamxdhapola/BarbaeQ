import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import { Store, Upload, CheckCircle, Eye, FileText, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { createShop, fetchMyShop } from '../../redux/slices/shop.slice.js';
import { DocumentModal } from '../../components/ui/DocumentModal';

const step1Schema = z.object({
  name: z.string().min(3, 'Shop name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Phone number must be exactly 10 digits starting with 6, 7, 8, or 9'),
  address: z.string().min(5, 'Address is required'),
  city: z.string().min(2, 'City is required'),
});

export const ShopRegistrationPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user } = useSelector((state) => state.auth);
  const { myShop } = useSelector((state) => state.shop);

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    phone: user?.phone || '',
    address: '',
    city: '',
  });
  const [files, setFiles] = useState({
    establishmentCert: null,
    addressProof: null,
    shopPhoto: null,
  });
  const [filePreviews, setFilePreviews] = useState({
    establishmentCert: null,
    addressProof: null,
    shopPhoto: null,
  });
  const [errors, setErrors] = useState({});

  // Fullscreen document preview modal state
  const [previewModal, setPreviewModal] = useState({ isOpen: false, url: '', title: '', isPdf: false });

  useEffect(() => {
    dispatch(fetchMyShop());
  }, [dispatch]);

  // Sync user phone into formData
  useEffect(() => {
    if (user?.phone) {
      setFormData(prev => ({ ...prev, phone: user.phone }));
    }
  }, [user?.phone]);

  // Scroll to top on step progression
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [step]);

  // Pre-fill form data if user is resubmitting a REJECTED shop
  useEffect(() => {
    if (myShop && myShop.status === 'REJECTED') {
      setFormData({
        name: myShop.name || '',
        description: myShop.description || '',
        phone: user?.phone || myShop.phone || '',
        address: myShop.address || '',
        city: myShop.city || '',
      });

      const docs = myShop.documents || {};
      setFilePreviews({
        establishmentCert: docs.establishmentCert ? { url: docs.establishmentCert, name: 'Previous Certificate' } : null,
        addressProof: docs.addressProof ? { url: docs.addressProof, name: 'Previous Address Proof' } : null,
        shopPhoto: docs.shopPhoto ? { url: docs.shopPhoto, name: 'Previous Shop Photo' } : null,
      });
    }
  }, [myShop, user?.phone]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      const digitsOnly = value.replace(/\D/g, '').slice(0, 10);
      setFormData(prev => ({ ...prev, phone: digitsOnly }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
  const ALLOWED_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png'];
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const INVALID_FILE_TYPE_MSG = 'Error: Invalid file type. Only JPG, PNG and PDF are allowed.';

  const handleFileChange = (e, field) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop()?.toLowerCase();

      const isValidMime = ALLOWED_MIME_TYPES.includes(file.type) || (file.type === '' && ALLOWED_EXTENSIONS.includes(fileExt));
      const isValidExt = ALLOWED_EXTENSIONS.includes(fileExt);

      if (!isValidMime || !isValidExt) {
        e.target.value = '';
        setFiles(prev => ({ ...prev, [field]: null }));
        setFilePreviews(prev => ({ ...prev, [field]: null }));
        toast.error(INVALID_FILE_TYPE_MSG);
        setErrors(prev => ({ ...prev, [field]: INVALID_FILE_TYPE_MSG }));
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        e.target.value = '';
        setFiles(prev => ({ ...prev, [field]: null }));
        setFilePreviews(prev => ({ ...prev, [field]: null }));
        toast.error('File size exceeds 5MB limit. Please upload a smaller file.');
        setErrors(prev => ({ ...prev, [field]: 'File size exceeds 5MB limit. Please upload a smaller file.' }));
        return;
      }

      setErrors(prev => ({ ...prev, [field]: '' }));
      setFiles(prev => ({ ...prev, [field]: file }));
      const objectUrl = URL.createObjectURL(file);
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      setFilePreviews(prev => ({
        ...prev,
        [field]: {
          url: objectUrl,
          name: file.name,
          isPdf,
        }
      }));
    }
  };

  const openPreview = (fieldKey, title) => {
    const prev = filePreviews[fieldKey];
    if (prev?.url) {
      setPreviewModal({ isOpen: true, url: prev.url, title, isPdf: prev.isPdf });
    }
  };

  const handleNext = () => {
    if (step === 1) {
      try {
        step1Schema.parse(formData);
        setErrors({});
        setStep(2);
      } catch (err) {
        if (err instanceof z.ZodError) {
          const newErrors = {};
          err.errors.forEach(e => {
            if (e.path[0]) newErrors[e.path[0].toString()] = e.message;
          });
          setErrors(newErrors);
        }
      }
    } else if (step === 2) {
      const hasCert = files.establishmentCert || filePreviews.establishmentCert?.url;
      const hasProof = files.addressProof || filePreviews.addressProof?.url;
      const hasPhoto = files.shopPhoto || filePreviews.shopPhoto?.url;

      if (!hasCert || !hasProof || !hasPhoto) {
        toast.error('Please upload all 3 required verification documents');
        return;
      }
      setStep(3);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        data.append(key, value);
      });
      if (files.establishmentCert) data.append('establishmentCert', files.establishmentCert);
      if (files.addressProof) data.append('addressProof', files.addressProof);
      if (files.shopPhoto) data.append('shopPhoto', files.shopPhoto);

      await dispatch(createShop(data)).unwrap();
      toast.success('Shop submitted for review!');
      navigate('/owner/dashboard');
    } catch (error) {
      const errMsg = error || 'Registration failed';
      toast.error(errMsg);
      setErrors(prev => ({ ...prev, submit: errMsg }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-slide-up">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ink mb-2">
          {myShop?.status === 'REJECTED' ? 'Update & Resubmit Shop Registration' : 'Register Your Shop'}
        </h1>
        <p className="text-muted">
          {myShop?.status === 'REJECTED' 
            ? 'Update your shop information or documents to resubmit for approval.' 
            : 'Provide details and verification documents for your barbershop.'}
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8 relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-zinc-200 -z-10 rounded-full">
          <div 
            className="h-full bg-zinc-900 transition-all duration-300 rounded-full"
            style={{ width: `${((step - 1) / 2) * 100}%` }}
          />
        </div>
        {[1, 2, 3].map(s => (
          <div 
            key={s} 
            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-4 transition-colors ${
              s < step ? 'bg-zinc-900 border-zinc-200 text-white' :
              s === step ? 'bg-zinc-900 border-zinc-300 text-white ring-4 ring-zinc-100' :
              'bg-zinc-100 border-white text-zinc-400'
            }`}
          >
            {s < step ? <CheckCircle className="w-5 h-5" /> : s}
          </div>
        ))}
      </div>

      <div className="card p-8">
        {step === 1 && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-lg font-semibold text-ink mb-4 flex items-center">
              <Store className="w-5 h-5 mr-2 text-zinc-900" /> Shop Information
            </h2>
            <div>
              <label className="label">Shop Name</label>
              <input name="name" value={formData.name} onChange={handleInputChange} className={`input ${errors.name ? 'input-error' : ''}`} placeholder="Awesome Barbers" />
              {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="label">Description</label>
              <textarea name="description" value={formData.description} onChange={handleInputChange} className={`input min-h-[100px] ${errors.description ? 'input-error' : ''}`} placeholder="Tell us about your shop..." />
              {errors.description && <p className="text-xs text-rose-500 mt-1">{errors.description}</p>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="label mb-0">Shop Contact Phone</label>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Locked</span>
                </div>
                <input 
                  name="phone" 
                  value={formData.phone || user?.phone || ''} 
                  disabled
                  readOnly
                  className="input bg-zinc-100/80 text-zinc-500 cursor-not-allowed border-zinc-200" 
                  placeholder="10-digit mobile number" 
                />
                <p className="text-[11px] text-zinc-400 mt-1">
                  Automatically set to your registered account phone number.
                </p>
                {errors.phone && <p className="text-xs text-rose-500 mt-1">{errors.phone}</p>}
              </div>
              <div>
                <label className="label">City</label>
                <input name="city" value={formData.city} onChange={handleInputChange} className={`input ${errors.city ? 'input-error' : ''}`} placeholder="e.g. Mumbai" />
                {errors.city && <p className="text-xs text-rose-500 mt-1">{errors.city}</p>}
              </div>
            </div>
            <div>
              <label className="label">Full Address</label>
              <input name="address" value={formData.address} onChange={handleInputChange} className={`input ${errors.address ? 'input-error' : ''}`} placeholder="123 Main St, Area..." />
              {errors.address && <p className="text-xs text-rose-500 mt-1">{errors.address}</p>}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ink flex items-center">
                <Upload className="w-5 h-5 mr-2 text-zinc-900" /> Upload Verification Documents
              </h2>
              <span className="text-[11px] font-bold text-zinc-500 bg-zinc-100 px-2.5 py-1 rounded-lg">
                Max 5MB per file
              </span>
            </div>

            {/* Document 1: Establishment Cert */}
            <div className={`p-5 border-2 border-dashed rounded-xl bg-zinc-50/70 space-y-3 transition-colors ${
              errors.establishmentCert ? 'border-rose-400 bg-rose-50/30' : 'border-zinc-300'
            }`}>
              <div className="flex justify-between items-start gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-ink text-sm">1. Shop & Establishment Certificate</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-zinc-200/80 text-zinc-700">
                      PDF, JPG, PNG
                    </span>
                  </div>
                  <p className="text-xs text-muted mt-0.5">Upload Shop Certificate (PDF/Image)</p>
                </div>
                {filePreviews.establishmentCert && (
                  <button
                    type="button"
                    onClick={() => openPreview('establishmentCert', 'Establishment Certificate')}
                    className="btn-secondary py-1 px-2.5 text-xs flex items-center gap-1.5 shrink-0"
                  >
                    <Eye className="w-3.5 h-3.5" /> Preview
                  </button>
                )}
              </div>
              
              <input 
                type="file" 
                onChange={(e) => handleFileChange(e, 'establishmentCert')} 
                accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" 
                className="text-xs text-muted file:mr-4 file:py-1.5 file:px-3.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-zinc-200 file:text-zinc-900 hover:file:bg-zinc-300 w-full" 
              />
              {errors.establishmentCert && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2 mt-2 animate-fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <p className="text-xs font-bold">{errors.establishmentCert}</p>
                </div>
              )}
              {filePreviews.establishmentCert?.name && !errors.establishmentCert && (
                <p className="text-xs text-emerald-700 font-medium flex items-center gap-1 mt-1">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Selected: {filePreviews.establishmentCert.name}
                </p>
              )}
            </div>

            {/* Document 2: Address Proof */}
            <div className={`p-5 border-2 border-dashed rounded-xl bg-zinc-50/70 space-y-3 transition-colors ${
              errors.addressProof ? 'border-rose-400 bg-rose-50/30' : 'border-zinc-300'
            }`}>
              <div className="flex justify-between items-start gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-ink text-sm">2. Shop Address Proof</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-zinc-200/80 text-zinc-700">
                      PDF, JPG, PNG
                    </span>
                  </div>
                  <p className="text-xs text-muted mt-0.5">Electricity Bill / Rent Agreement / Tax Receipt</p>
                </div>
                {filePreviews.addressProof && (
                  <button
                    type="button"
                    onClick={() => openPreview('addressProof', 'Address Proof')}
                    className="btn-secondary py-1 px-2.5 text-xs flex items-center gap-1.5 shrink-0"
                  >
                    <Eye className="w-3.5 h-3.5" /> Preview
                  </button>
                )}
              </div>
              
              <input 
                type="file" 
                onChange={(e) => handleFileChange(e, 'addressProof')} 
                accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" 
                className="text-xs text-muted file:mr-4 file:py-1.5 file:px-3.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-zinc-200 file:text-zinc-900 hover:file:bg-zinc-300 w-full" 
              />
              {errors.addressProof && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2 mt-2 animate-fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <p className="text-xs font-bold">{errors.addressProof}</p>
                </div>
              )}
              {filePreviews.addressProof?.name && !errors.addressProof && (
                <p className="text-xs text-emerald-700 font-medium flex items-center gap-1 mt-1">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Selected: {filePreviews.addressProof.name}
                </p>
              )}
            </div>

            {/* Document 3: Shop Photo */}
            <div className={`p-5 border-2 border-dashed rounded-xl bg-zinc-50/70 space-y-3 transition-colors ${
              errors.shopPhoto ? 'border-rose-400 bg-rose-50/30' : 'border-zinc-300'
            }`}>
              <div className="flex justify-between items-start gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-ink text-sm">3. Shop Front Photo</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-zinc-200/80 text-zinc-700">
                      JPG, PNG
                    </span>
                  </div>
                  <p className="text-xs text-muted mt-0.5">Clear photo of shop entrance & name board</p>
                </div>
                {filePreviews.shopPhoto && (
                  <button
                    type="button"
                    onClick={() => openPreview('shopPhoto', 'Shop Front Photo')}
                    className="btn-secondary py-1 px-2.5 text-xs flex items-center gap-1.5 shrink-0"
                  >
                    <Eye className="w-3.5 h-3.5" /> Preview
                  </button>
                )}
              </div>
              
              <input 
                type="file" 
                onChange={(e) => handleFileChange(e, 'shopPhoto')} 
                accept=".jpg,.jpeg,.png,image/jpeg,image/png" 
                className="text-xs text-muted file:mr-4 file:py-1.5 file:px-3.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-zinc-200 file:text-zinc-900 hover:file:bg-zinc-300 w-full" 
              />
              {errors.shopPhoto && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2 mt-2 animate-fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <p className="text-xs font-bold">{errors.shopPhoto}</p>
                </div>
              )}
              {filePreviews.shopPhoto?.name && !errors.shopPhoto && (
                <p className="text-xs text-emerald-700 font-medium flex items-center gap-1 mt-1">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Selected: {filePreviews.shopPhoto.name}
                </p>
              )}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-lg font-semibold text-ink mb-4">Review Details & Verification Documents</h2>
            <div className="bg-zinc-50 p-6 rounded-xl space-y-4 border border-zinc-200">
              <div>
                <p className="text-xs text-muted uppercase font-bold">Shop Name</p>
                <p className="font-bold text-ink text-lg mt-0.5">{formData.name}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted uppercase font-bold">Address</p>
                  <p className="font-semibold text-ink text-sm mt-0.5">{formData.address}, <span className="capitalize">{formData.city}</span></p>
                </div>
                <div>
                  <p className="text-xs text-muted uppercase font-bold">Phone</p>
                  <p className="font-semibold text-ink text-sm mt-0.5">{formData.phone}</p>
                </div>
              </div>

              {/* Uploaded Documents Grid */}
              <div className="pt-4 border-t border-zinc-200 space-y-3">
                <p className="text-xs text-muted uppercase font-bold">Verification Documents</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Establishment Cert */}
                  <div className="p-3 bg-white rounded-lg border border-zinc-200 flex flex-col justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-zinc-600" />
                      <span className="text-xs font-semibold text-ink truncate">Establishment Cert</span>
                    </div>
                    {filePreviews.establishmentCert ? (
                      <button
                        type="button"
                        onClick={() => openPreview('establishmentCert', 'Establishment Certificate')}
                        className="btn-secondary py-1 px-2 text-xs flex items-center justify-center gap-1 w-full"
                      >
                        <Eye className="w-3.5 h-3.5" /> Preview
                      </button>
                    ) : (
                      <span className="badge badge-danger text-[10px]">Missing</span>
                    )}
                  </div>

                  {/* Address Proof */}
                  <div className="p-3 bg-white rounded-lg border border-zinc-200 flex flex-col justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-zinc-600" />
                      <span className="text-xs font-semibold text-ink truncate">Address Proof</span>
                    </div>
                    {filePreviews.addressProof ? (
                      <button
                        type="button"
                        onClick={() => openPreview('addressProof', 'Address Proof')}
                        className="btn-secondary py-1 px-2 text-xs flex items-center justify-center gap-1 w-full"
                      >
                        <Eye className="w-3.5 h-3.5" /> Preview
                      </button>
                    ) : (
                      <span className="badge badge-danger text-[10px]">Missing</span>
                    )}
                  </div>

                  {/* Shop Photo */}
                  <div className="p-3 bg-white rounded-lg border border-zinc-200 flex flex-col justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-zinc-600" />
                      <span className="text-xs font-semibold text-ink truncate">Shop Front Photo</span>
                    </div>
                    {filePreviews.shopPhoto ? (
                      <button
                        type="button"
                        onClick={() => openPreview('shopPhoto', 'Shop Front Photo')}
                        className="btn-secondary py-1 px-2 text-xs flex items-center justify-center gap-1 w-full"
                      >
                        <Eye className="w-3.5 h-3.5" /> Preview
                      </button>
                    ) : (
                      <span className="badge badge-danger text-[10px]">Missing</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {errors.submit && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2.5 mt-6 animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <p className="text-xs font-bold">{errors.submit}</p>
          </div>
        )}

        <div className="mt-8 flex justify-between items-center pt-6 border-t border-zinc-100">
          <button 
            onClick={() => setStep(s => Math.max(1, s - 1))} 
            disabled={step === 1 || isLoading}
            className={`btn-ghost ${step === 1 ? 'invisible' : ''}`}
          >
            Back
          </button>
          
          {step < 3 ? (
            <button onClick={handleNext} className="btn-primary">
              Next Step
            </button>
          ) : (
            <button 
              onClick={handleSubmit} 
              disabled={isLoading}
              className="btn-primary"
            >
              {isLoading ? 'Submitting...' : myShop?.status === 'REJECTED' ? 'Resubmit for Review' : 'Submit for Review'}
            </button>
          )}
        </div>
      </div>

      {/* Full Document Preview Modal */}
      <DocumentModal
        isOpen={previewModal.isOpen}
        onClose={() => setPreviewModal({ isOpen: false, url: '', title: '', isPdf: false })}
        url={previewModal.url}
        title={previewModal.title}
        isPdf={previewModal.isPdf}
      />
    </div>
  );
};
