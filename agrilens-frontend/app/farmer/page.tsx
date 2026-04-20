"use client"; //this file must run on the browser

import { useEffect, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getAuthHeaders } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";
import AnnouncementBanner from "@/components/AnnouncementBanner";

//farmer and farm object types
type FarmerProfile = {
  _id: string;
  fullName: string;
  phone: string;
  address: string;
  nationalId?: string;
  experienceYears?: number;
};

type Farm = {
  _id: string;
  name: string;
  location: {
    district: string;
    upazila: string;
    address?: string;
  };
  sizeInAcres?: number;
  description?: string;
};

//Where the API is hosted(local host 3001)
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

//Page's memory state (actual data from the backend)
export default function FarmerPage() {
  const [profile, setProfile] = useState<FarmerProfile | null>(null);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);

//Form's memory state (data that the user is typing in the form)
  const [profileForm, setProfileForm] = useState({
    fullName: "",
    phone: "",
    address: "",
    nationalId: "",
    experienceYears: 0,
  });

  const [farmForm, setFarmForm] = useState({
    name: "",
    district: "",
    upazila: "",
    address: "",
    sizeInAcres: "",
    description: "",
  });

//The function loads data when page opens
  useEffect(() => {
    const fetchData = async () => { //this function fetches data from the backend and async=write code top to bottom fast
      try {
        const [profileRes, farmsRes] = await Promise.all([ //Promise.all=call multiple APIs at the same time
          fetch(`${API_BASE}/api/farmer/profile`, {
            headers: getAuthHeaders(), //authentication headers
          }),
          fetch(`${API_BASE}/api/farmer/farms`, {
            headers: getAuthHeaders(),
          }),
        ]);
        //set the profile data to the state
        if (profileRes.ok) {
          const data = await profileRes.json();
          setProfile(data);
          setProfileForm({
            fullName: data.fullName || "",
            phone: data.phone || "",
            address: data.address || "",
            nationalId: data.nationalId || "",
            experienceYears: data.experienceYears || 0,
          });
        }

        if (farmsRes.ok) {
          const farmsData = await farmsRes.json();
          setFarms(farmsData);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);
//The function saves the profile data to the backend
  const saveProfile = async () => {
    const res = await fetch(`${API_BASE}/api/farmer/profile`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(profileForm),
    });

    if (!res.ok) {
      alert("Failed to save profile");
      return;
    }

    const data = await res.json(); //convert the response to a JSON object
    setProfile(data);
    alert("Profile saved");
  };

  const createFarm = async () => { //The function creates a new farm
    const res = await fetch(`${API_BASE}/api/farmer/farms`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        name: farmForm.name,
        location: {
          district: farmForm.district,
          upazila: farmForm.upazila,
          address: farmForm.address,
        },
        sizeInAcres: Number(farmForm.sizeInAcres) || undefined,
        description: farmForm.description,
      }),
    });

    if (!res.ok) {
      alert("Failed to create farm");
      return;
    }

    const newFarm: Farm = await res.json();
    setFarms((prev) => [...prev, newFarm]);
    setFarmForm({
      name: "",
      district: "",
      upazila: "",
      address: "",
      sizeInAcres: "",
      description: "",
    });
  };

  const deleteFarm = async (id: string) => { //The function deletes a farm
    const res = await fetch(`${API_BASE}/api/farmer/farms/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      alert("Failed to delete farm");
      return;
    }

    setFarms((prev) => prev.filter((farm) => farm._id !== id)); //filter out the deleted farm
  };

  if (loading) { //If the data is still loading, show a loading message
    return <div className="p-6">Loading farmer data...</div>;
  }

  return ( //The function returns the JSX code that will be rendered to the page
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <AnnouncementBanner role="farmer" />
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-semibold">Farmer & Farm Management</h1>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/produce">My Listings</Link>
          </Button>
          <LogoutButton />
        </div>
      </div>

      <Card className="p-4 space-y-4">
        <h2 className="text-xl font-semibold">Farmer Profile</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            placeholder="Full Name"
            value={profileForm.fullName}
            onChange={(e) =>
              setProfileForm({ ...profileForm, fullName: e.target.value })
            }
          />
          <Input
            placeholder="Phone"
            value={profileForm.phone}
            onChange={(e) =>
              setProfileForm({ ...profileForm, phone: e.target.value })
            }
          />
          <Input
            placeholder="Address"
            value={profileForm.address}
            onChange={(e) =>
              setProfileForm({ ...profileForm, address: e.target.value })
            }
          />
          <Input
            placeholder="National ID (optional)"
            value={profileForm.nationalId}
            onChange={(e) =>
              setProfileForm({
                ...profileForm,
                nationalId: e.target.value,
              })
            }
          />
          <Input
            type="number"
            placeholder="Years of experience"
            value={profileForm.experienceYears}
            onChange={(e) =>
              setProfileForm({
                ...profileForm,
                experienceYears: Number(e.target.value) || 0,
              })
            }
          />
        </div>
        <Button className="mt-4" onClick={saveProfile}>
          Save Profile
        </Button>
      </Card>

      <Card className="p-4 space-y-4">
        <h2 className="text-xl font-semibold">Farms</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            placeholder="Farm name"
            value={farmForm.name}
            onChange={(e) =>
              setFarmForm({ ...farmForm, name: e.target.value })
            }
          />
          <Input
            placeholder="District"
            value={farmForm.district}
            onChange={(e) =>
              setFarmForm({ ...farmForm, district: e.target.value })
            }
          />
          <Input
            placeholder="Upazila"
            value={farmForm.upazila}
            onChange={(e) =>
              setFarmForm({ ...farmForm, upazila: e.target.value })
            }
          />
          <Input
            placeholder="Address"
            value={farmForm.address}
            onChange={(e) =>
              setFarmForm({ ...farmForm, address: e.target.value })
            }
          />
          <Input
            type="number"
            placeholder="Size (acres)"
            value={farmForm.sizeInAcres}
            onChange={(e) =>
              setFarmForm({
                ...farmForm,
                sizeInAcres: e.target.value,
              })
            }
          />
          <Input
            placeholder="Description"
            value={farmForm.description}
            onChange={(e) =>
              setFarmForm({
                ...farmForm,
                description: e.target.value,
              })
            }
          />
        </div>

        <Button className="mt-4" onClick={createFarm}>
          Add Farm
        </Button>

        <div className="mt-6 space-y-3">
          {farms.map((farm) => (
            <Card
              key={farm._id}
              className="p-3 flex items-center justify-between"
            >
              <div>
                <div className="font-medium">{farm.name}</div>
                <div className="text-sm text-zinc-500">
                  {farm.location.district}, {farm.location.upazila}
                </div>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => deleteFarm(farm._id)}
              >
                Delete
              </Button>
            </Card>
          ))}
          {farms.length === 0 && (
            <div className="text-sm text-zinc-500">No farms yet.</div>
          )}
        </div>
      </Card>
    </div>
  );
}

