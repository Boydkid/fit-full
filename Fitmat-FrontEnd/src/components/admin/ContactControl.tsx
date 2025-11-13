import { useEffect, useMemo, useState } from "react";

type ContactRequest = {
  id: number;
  name: string;
  email: string;
  phoneNumber: string;
  subject: string;
  message: string;
  createdAt: string;
  updatedAt: string;
};


type ContactAdminProps = {
  userId: number;
  className?: string;
  token?: string | null;
};

const RAW_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  process.env.NEXT_PUBLIC_BACKEND_API_BASE_URL ??
  "${process.env.NEXT_PUBLIC_API_URL}/api";

const API_BASE_URL = RAW_BASE_URL.endsWith("/")
  ? RAW_BASE_URL.slice(0, -1)
  : RAW_BASE_URL;

export default function ContactControl({ userId, className, token }: ContactAdminProps) {
  const [contacts, setContacts] = useState<ContactRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedContact, setSelectedContact] = useState<ContactRequest | null>(null);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [contactsError, setContactsError] = useState<string | null>(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  const canAct = useMemo(() => Number.isFinite(userId) && Number(userId) > 0, [userId]);

  useEffect(() => {
    let isMounted = true;

    async function fetchContacts() {
      setLoadingContacts(true);
      setContactsError(null);

      try {
        const response = await fetch(`${API_BASE_URL}/contact`, {
          headers: {
            "Authorization": token ? `Bearer ${token}` : "",
          },
        });
        const data = (await response.json()) as ContactRequest[] | { message?: string };

        if (!response.ok) {
          const message = "message" in data && data.message
            ? data.message
            : "Failed to fetch contact requests.";
          throw new Error(message);
        }

        if (!isMounted) return;
        setContacts(data as ContactRequest[]);
        setContactsError(null);
      } catch (err) {
        if (!isMounted) return;
        const message = err instanceof Error ? err.message : "Unexpected error fetching contact requests.";
        setContactsError(message);
      } finally {
        if (isMounted) {
          setLoadingContacts(false);
        }
      }
    }

    fetchContacts();

    return () => {
      isMounted = false;
    };
  }, [refreshIndex]);


  const handleRefresh = () => setRefreshIndex((value) => value + 1);

  const filteredContacts = useMemo(() => {
    if (!searchTerm.trim()) {
      return contacts;
    }

    const term = searchTerm.trim().toLowerCase();
    return contacts.filter((contact) => {
      return (
        contact.name.toLowerCase().includes(term) ||
        contact.email.toLowerCase().includes(term) ||
        contact.phoneNumber.toLowerCase().includes(term) ||
        contact.subject.toLowerCase().includes(term) ||
        contact.message.toLowerCase().includes(term)
      );
    });
  }, [contacts, searchTerm]);

  const formatDate = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleString();
  };


  return (
    <section className={`w-full h-full bg-white border border-slate-200 rounded-xl shadow-md hover:shadow-lg transition-shadow flex flex-col ${className ?? ""}`}>
      <header className="flex flex-col gap-3 px-6 py-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-100 rounded-xl shadow-sm">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-1">Contact Requests</h2>
            <p className="text-base text-slate-600">Review incoming messages and assign follow ups.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by name, email, or subject"
            className="w-64 rounded-lg border-2 border-slate-300 px-4 py-2.5 text-base font-medium focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-red-400 transition-all hover:border-slate-400"
          />
          <button
            type="button"
            onClick={handleRefresh}
            disabled={loadingContacts}
            className={`px-5 py-3 text-base font-semibold rounded-lg border-2 border-slate-300 text-slate-700 hover:bg-slate-100 hover:border-slate-400 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed ${
              loadingContacts ? "" : "hover:scale-105"
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </span>
          </button>
        </div>
      </header>

      {contactsError && (
        <div className="px-6 pt-4">
          <div className="mb-4 px-5 py-4 text-base text-red-700 bg-red-50 border-l-4 border-red-500 rounded-lg shadow-md">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-semibold">{contactsError}</span>
            </div>
          </div>
        </div>
      )}

      {!canAct && (
        <div className="px-6 py-4 text-sm text-slate-600">
          Provide a valid admin user id to manage contact requests.
        </div>
      )}

      {canAct && (
        <div className="overflow-x-auto flex-1 min-h-0">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-gradient-to-r from-slate-100 to-slate-50 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-bold text-slate-700 uppercase tracking-wider">Subject</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-slate-700 uppercase tracking-wider">Requester</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-slate-700 uppercase tracking-wider">Submitted</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-slate-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {loadingContacts ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-base text-slate-500">
                    Loading contact requests...
                  </td>
                </tr>
              ) : filteredContacts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-base text-slate-500">
                    No contact requests found.
                  </td>
                </tr>
              ) : (
                filteredContacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-gradient-to-r hover:from-slate-50 hover:to-white transition-all duration-200 border-b border-slate-100">
                    <td className="px-6 py-5 text-base text-slate-800">
                      <div className="font-bold text-slate-900 text-lg mb-1">{contact.subject}</div>
                      <div className="text-sm text-slate-600 mt-1 line-clamp-2 leading-relaxed">{contact.message}</div>
                    </td>
                    <td className="px-6 py-5 text-base text-slate-800">
                      <div className="font-semibold text-slate-900">{contact.name}</div>
                      <div className="text-sm text-slate-600 mt-1">{contact.email}</div>
                      <div className="text-sm text-slate-600">{contact.phoneNumber}</div>
                    </td>
                    <td className="px-6 py-5 text-base text-slate-600 whitespace-nowrap font-medium">{formatDate(contact.createdAt)}</td>
                    <td className="px-6 py-5 text-base">
                      <button
                        type="button"
                        onClick={() => setSelectedContact(contact)}
                        className="px-5 py-2.5 text-base font-bold text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {selectedContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4">
          <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl">
            <div className="px-8 py-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">Contact Details</h3>
                  <p className="mt-1 text-base text-slate-600">
                    Submitted on {formatDate(selectedContact.createdAt)}
                  </p>
                </div>
              </div>
            </div>
            <div className="px-8 py-6 space-y-6 text-base max-h-[60vh] overflow-y-auto">
              <div>
                <span className="uppercase text-xs font-bold tracking-wide text-slate-500 mb-2 block">Name</span>
                <div className="text-slate-900 font-semibold text-lg">{selectedContact.name}</div>
              </div>
              <div>
                <span className="uppercase text-xs font-bold tracking-wide text-slate-500 mb-2 block">Email</span>
                <div className="text-slate-900 font-medium">{selectedContact.email}</div>
              </div>
              <div>
                <span className="uppercase text-xs font-bold tracking-wide text-slate-500 mb-2 block">Phone</span>
                <div className="text-slate-900 font-medium">{selectedContact.phoneNumber}</div>
              </div>
              <div>
                <span className="uppercase text-xs font-bold tracking-wide text-slate-500 mb-2 block">Subject</span>
                <div className="text-slate-900 font-semibold text-lg">{selectedContact.subject}</div>
              </div>
              <div>
                <span className="uppercase text-xs font-bold tracking-wide text-slate-500 mb-2 block">Message</span>
                <div className="mt-2 whitespace-pre-wrap text-slate-700 leading-relaxed p-4 bg-slate-50 rounded-lg border border-slate-200">{selectedContact.message}</div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-8 py-5 border-t border-slate-200 bg-slate-50">
              <button
                type="button"
                onClick={() => setSelectedContact(null)}
                className="px-6 py-3 text-base font-semibold text-slate-700 hover:text-slate-900 border-2 border-slate-300 rounded-lg hover:bg-slate-100 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}



