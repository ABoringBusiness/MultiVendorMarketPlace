import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllUserDetails } from "@/store/slices/superAdminSlice";

const AllUsersList = () => {
  const dispatch = useDispatch();
  const { users, loading } = useSelector((state) => state.superAdmin);

  useEffect(() => {
    if (!users || users.length === 0) {
      dispatch(getAllUserDetails());
    }
  }, [dispatch, users]);

  return (
    <section className="w-full p-8 bg-gray-50 min-h-screen flex justify-center items-center">
      <div className="bg-white shadow-lg rounded-lg w-full max-w-5xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Manage Users</h1>
        </div>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="py-4 px-6 bg-gray-200 text-left text-sm font-bold text-gray-700">
                  Name
                </th>
                <th className="py-4 px-6 bg-gray-200 text-left text-sm font-bold text-gray-700">
                  Email
                </th>
                <th className="py-4 px-6 bg-gray-200 text-left text-sm font-bold text-gray-700">
                  Joined Date
                </th>
                <th className="py-4 px-6 bg-gray-200 text-left text-sm font-bold text-gray-700">
                  Role
                </th>
                <th className="py-4 px-6 bg-gray-200 text-left text-sm font-bold text-gray-700">
                  Phone
                </th>
                <th className="py-4 px-6 bg-gray-200 text-left text-sm font-bold text-gray-700">
                  Address
                </th>
              </tr>
            </thead>
            <tbody className="text-gray-800">
              {users && users.length > 0 ? (
                users.map((user, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="py-4 px-6 flex items-center gap-3">
                      <img
                        src={user.profileImage?.url}
                        alt={`${user.userName}'s profile`}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <span>{user.userName}</span>
                    </td>
                    <td className="py-4 px-6">{user.email}</td>
                    <td className="py-4 px-6">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6">{user.role}</td>
                    <td className="py-4 px-6">{user.phone}</td>
                    <td className="py-4 px-6">{user.address}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center text-xl text-sky-600 py-3"
                  >
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
};

export default AllUsersList;
